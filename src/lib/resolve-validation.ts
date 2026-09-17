import { unexpectedConsumerResponse } from './safe-error';

export type ResolvedCredential = Readonly<{
  credentialKey: string;
  values: Readonly<Record<string, string>>;
}>;

export function normalizeSecretNames(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw unexpectedConsumerResponse();
  }
  const names = value.map((name) => {
    if (typeof name !== 'string' || !name.trim() || name.includes('*')) {
      throw unexpectedConsumerResponse();
    }
    return name;
  });
  if (new Set(names).size !== names.length) {
    throw unexpectedConsumerResponse();
  }
  return names;
}

export function validateResolveResponse(
  payload: unknown,
  credentialKey: string,
  requestedNames: readonly string[],
): ResolvedCredential {
  const envelope = asExactRecord(payload, ['success', 'meta', 'data']);
  const meta = asExactRecord(envelope.meta, ['apiVersion']);
  if (envelope.success !== true || meta.apiVersion !== 'v1') {
    throw unexpectedConsumerResponse();
  }

  const document = asExactRecord(envelope.data, ['credentialKey', 'providerKey', 'lifecycleState', 'secrets']);
  if (
    document.credentialKey !== credentialKey ||
    typeof document.providerKey !== 'string' || !document.providerKey ||
    document.lifecycleState !== 'active' ||
    !isRecord(document.secrets)
  ) {
    throw unexpectedConsumerResponse();
  }

  const values = document.secrets;
  const keys = Object.keys(values);
  if (
    keys.length !== requestedNames.length ||
    keys.some((name) => !requestedNames.includes(name) || typeof values[name] !== 'string')
  ) {
    throw unexpectedConsumerResponse();
  }
  const safeValues: Record<string, string> = {};
  for (const name of requestedNames) {
    safeValues[name] = values[name] as string;
  }
  return { credentialKey, values: safeValues };
}

function asExactRecord(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!isRecord(value)) {
    throw unexpectedConsumerResponse();
  }
  if (Object.keys(value).length !== keys.length || Object.keys(value).some((key) => !keys.includes(key))) {
    throw unexpectedConsumerResponse();
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
