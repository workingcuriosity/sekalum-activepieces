const CANONICAL_ERROR_CODES = {
  400: ['INVALID_SECRET_REQUEST'],
  401: ['API_TOKEN_AUTH_FAILED'],
  403: ['CONSUMER_SCOPE_MISSING', 'CONSUMER_ACCESS_DENIED', 'RESOLVE_NOT_AVAILABLE'],
} as const;

export type CanonicalErrorCode =
  (typeof CANONICAL_ERROR_CODES)[keyof typeof CANONICAL_ERROR_CODES][number];

export class SafeConsumerError extends Error {
  public constructor(
    public readonly status: number | undefined,
    public readonly code: CanonicalErrorCode | 'UNEXPECTED_CONSUMER_RESPONSE',
  ) {
    super(messageFor(code));
    this.name = 'SafeConsumerError';
  }
}

export function safeErrorFromResponse(status: number, payload: unknown): SafeConsumerError {
  const code = readCanonicalCode(status, payload);
  return new SafeConsumerError(status, code ?? 'UNEXPECTED_CONSUMER_RESPONSE');
}

export function unexpectedConsumerResponse(): SafeConsumerError {
  return new SafeConsumerError(undefined, 'UNEXPECTED_CONSUMER_RESPONSE');
}

export function safeActionMessage(error: unknown): string {
  if (error instanceof SafeConsumerError) {
    return error.message;
  }
  return 'The Consumer API request could not be completed safely.';
}

function readCanonicalCode(status: number, payload: unknown): CanonicalErrorCode | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return undefined;
  const envelope = payload as Record<string, unknown>;
  if (envelope.success !== false || !envelope.error || typeof envelope.error !== 'object' || Array.isArray(envelope.error)) {
    return undefined;
  }
  const error = envelope.error as Record<string, unknown>;
  const code = error.code;
  const expected = CANONICAL_ERROR_CODES[status as keyof typeof CANONICAL_ERROR_CODES];
  return typeof code === 'string' && expected?.includes(code as never)
    ? code as CanonicalErrorCode
    : undefined;
}

function messageFor(code: SafeConsumerError['code']): string {
  switch (code) {
    case 'INVALID_SECRET_REQUEST':
      return 'The requested fields are not valid for this credential.';
    case 'API_TOKEN_AUTH_FAILED':
      return 'Consumer API authentication failed.';
    case 'CONSUMER_SCOPE_MISSING':
      return 'The Consumer API token does not have the required scope.';
    case 'CONSUMER_ACCESS_DENIED':
      return 'Consumer access was denied.';
    case 'RESOLVE_NOT_AVAILABLE':
      return 'Resolving this credential is not available.';
    default:
      return 'The Consumer API returned an unexpected response.';
  }
}
