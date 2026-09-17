import { projectDiscoveryResponse, type CredentialSelection } from './discovery-projection';
import { normalizeSecretNames, validateResolveResponse, type ResolvedCredential } from './resolve-validation';
import { safeErrorFromResponse, unexpectedConsumerResponse } from './safe-error';

export type ConsumerClientOptions = Readonly<{
  baseUrl: string;
  token: string;
  fetch?: typeof globalThis.fetch;
}>;

/** Consumer API client with no persistence, logging, telemetry, or response cache. */
export class ConsumerClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly fetchImplementation: typeof globalThis.fetch;

  public constructor(options: ConsumerClientOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    if (!options.token) {
      throw unexpectedConsumerResponse();
    }
    this.token = options.token;
    this.fetchImplementation = options.fetch ?? globalThis.fetch;
  }

  public async discover(): Promise<CredentialSelection[]> {
    const payload = await this.request('api/v1/consumer/credentials', { method: 'GET' });
    return projectDiscoveryResponse(payload);
  }

  public async resolve(credentialKey: string, secretNames: unknown): Promise<ResolvedCredential> {
    if (typeof credentialKey !== 'string' || !credentialKey) {
      throw unexpectedConsumerResponse();
    }
    const normalizedNames = normalizeSecretNames(secretNames);
    const encodedCredentialKey = encodeURIComponent(credentialKey);
    const payload = await this.request(
      `api/v1/consumer/credentials/${encodedCredentialKey}/resolve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretNames: normalizedNames }),
      },
    );
    return validateResolveResponse(payload, credentialKey, normalizedNames);
  }

  private async request(path: string, init: RequestInit): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetchImplementation(new URL(path, `${this.baseUrl}/`).toString(), {
        ...init,
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Cache-Control': 'no-store',
          ...init.headers,
        },
      });
    } catch {
      throw unexpectedConsumerResponse();
    }

    const payload = await parseJson(response);
    if (!response.ok) {
      throw safeErrorFromResponse(response.status, payload);
    }
    return payload;
  }
}

function normalizeBaseUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw unexpectedConsumerResponse();
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw unexpectedConsumerResponse();
  }
  parsed.hash = '';
  parsed.search = '';
  return parsed.toString().replace(/\/$/, '');
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw unexpectedConsumerResponse();
  }
}
