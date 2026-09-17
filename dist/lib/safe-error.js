"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeConsumerError = void 0;
exports.safeErrorFromResponse = safeErrorFromResponse;
exports.unexpectedConsumerResponse = unexpectedConsumerResponse;
exports.safeActionMessage = safeActionMessage;
const CANONICAL_ERROR_CODES = {
    400: ['INVALID_SECRET_REQUEST'],
    401: ['API_TOKEN_AUTH_FAILED'],
    403: ['CONSUMER_SCOPE_MISSING', 'CONSUMER_ACCESS_DENIED', 'RESOLVE_NOT_AVAILABLE'],
};
class SafeConsumerError extends Error {
    status;
    code;
    constructor(status, code) {
        super(messageFor(code));
        this.status = status;
        this.code = code;
        this.name = 'SafeConsumerError';
    }
}
exports.SafeConsumerError = SafeConsumerError;
function safeErrorFromResponse(status, payload) {
    const code = readCanonicalCode(status, payload);
    return new SafeConsumerError(status, code ?? 'UNEXPECTED_CONSUMER_RESPONSE');
}
function unexpectedConsumerResponse() {
    return new SafeConsumerError(undefined, 'UNEXPECTED_CONSUMER_RESPONSE');
}
function safeActionMessage(error) {
    if (error instanceof SafeConsumerError) {
        return error.message;
    }
    return 'The Consumer API request could not be completed safely.';
}
function readCanonicalCode(status, payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload))
        return undefined;
    const envelope = payload;
    if (envelope.success !== false || !envelope.error || typeof envelope.error !== 'object' || Array.isArray(envelope.error)) {
        return undefined;
    }
    const error = envelope.error;
    const code = error.code;
    const expected = CANONICAL_ERROR_CODES[status];
    return typeof code === 'string' && expected?.includes(code)
        ? code
        : undefined;
}
function messageFor(code) {
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
