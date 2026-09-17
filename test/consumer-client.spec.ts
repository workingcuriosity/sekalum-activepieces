import { describe, expect, it } from 'vitest';
import { ConsumerClient } from '../src/lib/consumer-client';
import { SafeConsumerError } from '../src/lib/safe-error';

type CapturedRequest = { url: string; init: RequestInit };

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function clientReturning(body: unknown, status = 200): { client: ConsumerClient; requests: CapturedRequest[] } {
  const requests: CapturedRequest[] = [];
  const client = new ConsumerClient({
    baseUrl: 'https://consumer.example.test/root/',
    token: 'fixture-connection-value',
    fetch: async (url, init) => {
      requests.push({ url: String(url), init: init ?? {} });
      return response(body, status);
    },
  });
  return { client, requests };
}

const success = (data: unknown) => ({ success: true, meta: { apiVersion: 'v1' }, data });
const discovery = (credentials: unknown[]) => success({ credentials });
const resolved = (credentialKey: string, secrets: Record<string, string>) => success({
  credentialKey,
  providerKey: 'fixture-provider',
  lifecycleState: 'active',
  secrets,
});
const failure = (code: string) => ({ success: false, error: { code, message: 'not-safe-to-share' } });

describe('ConsumerClient', () => {
  it('T-AUTH-001 sends Consumer bearer authentication and no legacy header', async () => {
    const { client, requests } = clientReturning(discovery([]));
    await client.discover();
    const headers = new Headers(requests[0].init.headers);
    expect(headers.get('authorization')).toMatch(/^Bearer /);
    expect(headers.has('x-user-id')).toBe(false);
    expect(headers.has('x-api-key')).toBe(false);
  });

  it('T-AUTH-002 uses the configured base URL only', async () => {
    const { client, requests } = clientReturning(discovery([]));
    await client.discover();
    expect(requests[0].url).toBe('https://consumer.example.test/root/api/v1/consumer/credentials');
  });

  it('T-SEC-001 requests no-store transport behavior', async () => {
    const { client, requests } = clientReturning(discovery([]));
    await client.discover();
    expect(requests[0].init.cache).toBe('no-store');
    expect(new Headers(requests[0].init.headers).get('cache-control')).toBe('no-store');
  });

  it('T-DISC-EMPTY-001 treats an authorized empty collection as a success', async () => {
    const { client } = clientReturning(discovery([]));
    await expect(client.discover()).resolves.toEqual([]);
  });

  it('T-DISC-001 preserves an opaque credential key and tolerates current public projection fields', async () => {
    const { client } = clientReturning(discovery([{ credentialKey: 'opaque/key value', metadata: { displayName: 'Example' }, fields: [], runtimePublic: { clientId: 'public' } }]));
    await expect(client.discover()).resolves.toEqual([{ credentialKey: 'opaque/key value' }]);
  });

  it('T-DISC-PROJECTION-001 rejects a discovery entry with internal fields', async () => {
    const { client } = clientReturning(discovery([{ credentialKey: 'opaque', internalId: 'not-public' }]));
    await expect(client.discover()).rejects.toMatchObject({ code: 'UNEXPECTED_CONSUMER_RESPONSE' });
  });

  it('T-DISC-MALFORMED-001 fails closed for malformed discovery envelopes', async () => {
    const { client } = clientReturning({ data: { credentials: [] } });
    await expect(client.discover()).rejects.toMatchObject({ code: 'UNEXPECTED_CONSUMER_RESPONSE' });
  });

  it('T-AP-RUNTIME-002 fails closed when a response cannot be decoded', async () => {
    const client = new ConsumerClient({ baseUrl: 'https://consumer.example.test', token: 'fixture-connection-value', fetch: async () => new Response('not-json', { status: 200 }) });
    await expect(client.discover()).rejects.toMatchObject({ code: 'UNEXPECTED_CONSUMER_RESPONSE' });
  });

  it('T-LIFE-001 rejects a discovery result that attempts to assert lifecycle state locally', async () => {
    const { client } = clientReturning(discovery([{ credentialKey: 'opaque', state: 'active' }]));
    await expect(client.discover()).rejects.toMatchObject({ code: 'UNEXPECTED_CONSUMER_RESPONSE' });
  });

  it('T-LIFE-ACTIVE-001 accepts the server-projected public credential selection', async () => {
    const { client } = clientReturning(discovery([{ credentialKey: 'opaque', metadata: { displayName: 'opaque' }, fields: [] }]));
    await expect(client.discover()).resolves.toEqual([{ credentialKey: 'opaque' }]);
  });

  it('T-LIFE-DENIED-001 retains a server access denial as a controlled failure', async () => {
    const { client } = clientReturning(failure('CONSUMER_ACCESS_DENIED'), 403);
    await expect(client.discover()).rejects.toMatchObject({ status: 403, code: 'CONSUMER_ACCESS_DENIED' });
  });

  it('T-RESOLVE-001 sends the canonical resolve method and encoded opaque key', async () => {
    const { client, requests } = clientReturning(resolved('opaque/key value', { field: 'fixture' }));
    await client.resolve('opaque/key value', ['field']);
    expect(requests[0].init.method).toBe('POST');
    expect(requests[0].url).toBe('https://consumer.example.test/root/api/v1/consumer/credentials/opaque%2Fkey%20value/resolve');
  });

  it('T-RESOLVE-REQUEST-001 sends only the exact requested field list', async () => {
    const { client, requests } = clientReturning(resolved('opaque', { field: 'fixture' }));
    await client.resolve('opaque', ['field']);
    expect(JSON.parse(String(requests[0].init.body))).toEqual({ secretNames: ['field'] });
  });

  it('T-RESOLVE-ENVELOPE-001 normalizes the canonical success envelope to the selected opaque key', async () => {
    const { client } = clientReturning(resolved('opaque', { field: 'fixture' }));
    await expect(client.resolve('opaque', ['field'])).resolves.toEqual({ credentialKey: 'opaque', values: { field: 'fixture' } });
  });

  it('T-RESOLVE-OPAQUE-001 rejects a response for a different opaque key', async () => {
    const { client } = clientReturning(resolved('other-key', { field: 'fixture' }));
    await expect(client.resolve('opaque', ['field'])).rejects.toMatchObject({ code: 'UNEXPECTED_CONSUMER_RESPONSE' });
  });

  it('T-RESOLVE-LEGACY-001 rejects the obsolete adapter-local credentialKey/values envelope', async () => {
    const { client } = clientReturning({ credentialKey: 'opaque', values: { field: 'fixture' } });
    await expect(client.resolve('opaque', ['field'])).rejects.toMatchObject({ code: 'UNEXPECTED_CONSUMER_RESPONSE' });
  });

  it('T-RESOLVE-NO-OUTPUT-001 consumes only requested response fields', async () => {
    const { client } = clientReturning(resolved('opaque', { field: 'fixture', extra: 'unexpected' }));
    await expect(client.resolve('opaque', ['field'])).rejects.toMatchObject({ code: 'UNEXPECTED_CONSUMER_RESPONSE' });
  });

  it('T-RESOLVE-REQUEST-002 rejects an empty requested field list before a request', async () => {
    const { client, requests } = clientReturning(resolved('opaque', {}));
    await expect(client.resolve('opaque', [])).rejects.toMatchObject({ code: 'UNEXPECTED_CONSUMER_RESPONSE' });
    expect(requests).toHaveLength(0);
  });

  it('T-RESOLVE-REQUEST-003 rejects wildcards before a request', async () => {
    const { client, requests } = clientReturning(resolved('opaque', {}));
    await expect(client.resolve('opaque', ['*'])).rejects.toMatchObject({ code: 'UNEXPECTED_CONSUMER_RESPONSE' });
    expect(requests).toHaveLength(0);
  });

  it('T-RESOLVE-REQUEST-004 rejects duplicate requested fields before a request', async () => {
    const { client, requests } = clientReturning(resolved('opaque', {}));
    await expect(client.resolve('opaque', ['field', 'field'])).rejects.toMatchObject({ code: 'UNEXPECTED_CONSUMER_RESPONSE' });
    expect(requests).toHaveLength(0);
  });

  it.each([[400, 'INVALID_SECRET_REQUEST'], [401, 'API_TOKEN_AUTH_FAILED'], [403, 'CONSUMER_SCOPE_MISSING'], [403, 'CONSUMER_ACCESS_DENIED'], [403, 'RESOLVE_NOT_AVAILABLE']])('T-ERR canonical %i %s is preserved without response detail', async (status, code) => {
    const { client } = clientReturning(failure(code), status);
    await expect(client.discover()).rejects.toMatchObject({ status, code });
    await expect(client.discover()).rejects.not.toThrow('not-safe-to-share');
  });

  it('T-ERR-MALFORMED-001 fails closed for an unrecognized denial', async () => {
    const { client } = clientReturning(failure('UNRECOGNIZED'), 403);
    await expect(client.discover()).rejects.toMatchObject({ code: 'UNEXPECTED_CONSUMER_RESPONSE' });
  });

  it('T-AP-RUNTIME-001 fails closed when fetch cannot return a response', async () => {
    const client = new ConsumerClient({ baseUrl: 'https://consumer.example.test', token: 'fixture-connection-value', fetch: async () => Promise.reject(new Error('transport detail')) });
    await expect(client.discover()).rejects.toBeInstanceOf(SafeConsumerError);
    await expect(client.discover()).rejects.not.toThrow('transport detail');
  });
});
