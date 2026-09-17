import { unexpectedConsumerResponse } from './safe-error';

export type CredentialSelection = Readonly<{
  credentialKey: string;
}>;

const DISCOVERY_ENTRY_KEYS = ['credentialKey', 'metadata', 'fields', 'runtimePublic'] as const;

export function projectDiscoveryResponse(payload: unknown): CredentialSelection[] {
  const data = successData(payload);
  const document = asExactRecord(data, ['credentials']);
  if (!Array.isArray(document.credentials)) {
    throw unexpectedConsumerResponse();
  }

  return document.credentials.map((credential) => {
    const selection = asAllowedRecord(credential, DISCOVERY_ENTRY_KEYS);
    if (typeof selection.credentialKey !== 'string' || !selection.credentialKey) {
      throw unexpectedConsumerResponse();
    }
    return { credentialKey: selection.credentialKey };
  });
}

function successData(payload: unknown): unknown {
  const envelope = asExactRecord(payload, ['success', 'meta', 'data']);
  const meta = asExactRecord(envelope.meta, ['apiVersion']);
  if (envelope.success !== true || meta.apiVersion !== 'v1') {
    throw unexpectedConsumerResponse();
  }
  return envelope.data;
}

function asExactRecord(value: unknown, keys: readonly string[]): Record<string, unknown> {
  const record = asRecord(value);
  if (Object.keys(record).length !== keys.length || Object.keys(record).some((key) => !keys.includes(key))) {
    throw unexpectedConsumerResponse();
  }
  return record;
}

function asAllowedRecord(value: unknown, keys: readonly string[]): Record<string, unknown> {
  const record = asRecord(value);
  if (Object.keys(record).some((key) => !keys.includes(key))) {
    throw unexpectedConsumerResponse();
  }
  return record;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw unexpectedConsumerResponse();
  }
  return value as Record<string, unknown>;
}
