declare const CANONICAL_ERROR_CODES: {
    readonly 400: readonly ["INVALID_SECRET_REQUEST"];
    readonly 401: readonly ["API_TOKEN_AUTH_FAILED"];
    readonly 403: readonly ["CONSUMER_SCOPE_MISSING", "CONSUMER_ACCESS_DENIED", "RESOLVE_NOT_AVAILABLE"];
};
export type CanonicalErrorCode = (typeof CANONICAL_ERROR_CODES)[keyof typeof CANONICAL_ERROR_CODES][number];
export declare class SafeConsumerError extends Error {
    readonly status: number | undefined;
    readonly code: CanonicalErrorCode | 'UNEXPECTED_CONSUMER_RESPONSE';
    constructor(status: number | undefined, code: CanonicalErrorCode | 'UNEXPECTED_CONSUMER_RESPONSE');
}
export declare function safeErrorFromResponse(status: number, payload: unknown): SafeConsumerError;
export declare function unexpectedConsumerResponse(): SafeConsumerError;
export declare function safeActionMessage(error: unknown): string;
export {};
