import { once } from 'node:events';
import { createServer, type IncomingHttpHeaders, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { describe, expect, it } from 'vitest';
import { ConsumerClient } from '../src/lib/consumer-client';

type LoopbackRequest = Readonly<{
  method: string | undefined;
  url: string | undefined;
  headers: IncomingHttpHeaders;
  body: string;
}>;

type LoopbackResponse = Readonly<{ status?: number; body: unknown }>;

async function withLoopback(
  responder: (request: LoopbackRequest) => LoopbackResponse,
  run: (baseUrl: string, requests: readonly LoopbackRequest[]) => Promise<void>,
): Promise<void> {
  const requests: LoopbackRequest[] = [];
  let handlerError: unknown;
  const server = createServer((request, response) => { void respond(request, response); });

  async function respond(request: IncomingMessage, response: ServerResponse): Promise<void> {
    try {
      let body = '';
      request.setEncoding('utf8');
      for await (const chunk of request) body += chunk;
      const captured = { method: request.method, url: request.url, headers: request.headers, body };
      requests.push(captured);
      const reply = responder(captured);
      response.writeHead(reply.status ?? 200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(reply.body));
    } catch (error) {
      handlerError = error;
      response.statusCode = 500;
      response.end();
    }
  }

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') {
    await closeServer(server);
    throw new Error('The local integration server did not expose a TCP port.');
  }
  try {
    await run(`http://127.0.0.1:${address.port}`, requests);
    if (handlerError) throw handlerError;
  } finally {
    await closeServer(server);
  }
}

async function closeServer(server: Server): Promise<void> {
  server.close();
  await once(server, 'close');
}

const success = (data: unknown) => ({ success: true, meta: { apiVersion: 'v1' }, data });

describe('ConsumerClient local-loopback integration', () => {
  it('T-INT-DISC-001 uses the canonical discovery endpoint and public projection over real fetch transport', async () => {
    await withLoopback(
      () => ({ body: success({ credentials: [{ credentialKey: 'opaque/key value', metadata: { displayName: 'Example' }, fields: [] }] }) }),
      async (baseUrl, requests) => {
        const client = new ConsumerClient({ baseUrl, token: 'x' });
        await expect(client.discover()).resolves.toEqual([{ credentialKey: 'opaque/key value' }]);
        expect(requests).toHaveLength(1);
        expect(requests[0].method).toBe('GET');
        expect(requests[0].url).toBe('/api/v1/consumer/credentials');
        expect(String(requests[0].headers.authorization)).toMatch(/^Bearer \S+$/);
        expect(requests[0].headers['cache-control']).toBe('no-store');
      },
    );
  });

  it('T-INT-RESOLVE-001 uses an encoded key, exact field body, and canonical response envelope', async () => {
    await withLoopback(
      () => ({ body: success({ credentialKey: 'opaque/key value', providerKey: 'fixture-provider', lifecycleState: 'active', secrets: { field: 'test-value' } }) }),
      async (baseUrl, requests) => {
        const client = new ConsumerClient({ baseUrl, token: 'x' });
        await expect(client.resolve('opaque/key value', ['field'])).resolves.toEqual({ credentialKey: 'opaque/key value', values: { field: 'test-value' } });
        expect(requests).toHaveLength(1);
        expect(requests[0].method).toBe('POST');
        expect(requests[0].url).toBe('/api/v1/consumer/credentials/opaque%2Fkey%20value/resolve');
        expect(JSON.parse(requests[0].body)).toEqual({ secretNames: ['field'] });
      },
    );
  });

  it('T-INT-DENIED-001 preserves a local canonical access denial', async () => {
    await withLoopback(
      () => ({ status: 403, body: { success: false, error: { code: 'CONSUMER_ACCESS_DENIED', message: 'denied' } } }),
      async (baseUrl) => {
        const client = new ConsumerClient({ baseUrl, token: 'x' });
        await expect(client.discover()).rejects.toMatchObject({ status: 403, code: 'CONSUMER_ACCESS_DENIED' });
      },
    );
  });

  it('T-INT-MALFORMED-001 fails closed for a sensitive malformed discovery entry', async () => {
    await withLoopback(
      () => ({ body: success({ credentials: [{ credentialKey: 'opaque', internalId: 'forbidden' }] }) }),
      async (baseUrl) => {
        const client = new ConsumerClient({ baseUrl, token: 'x' });
        await expect(client.discover()).rejects.toMatchObject({ code: 'UNEXPECTED_CONSUMER_RESPONSE' });
      },
    );
  });
});
