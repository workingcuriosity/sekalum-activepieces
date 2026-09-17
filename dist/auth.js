"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sekalumAuth = void 0;
exports.readSekalumAuth = readSekalumAuth;
const pieces_framework_1 = require("@activepieces/pieces-framework");
/**
 * Activepieces retains this connection. The piece itself has no credential,
 * secret, cache, or refresh store.
 */
exports.sekalumAuth = pieces_framework_1.PieceAuth.CustomAuth({
    displayName: 'Sekalum Consumer API',
    description: 'Connect with a Sekalum Consumer API token.',
    required: true,
    props: {
        consumerApiBaseUrl: pieces_framework_1.Property.ShortText({
            displayName: 'Consumer API base URL',
            description: 'The base URL of the Sekalum Consumer API.',
            required: true,
        }),
        consumerApiToken: pieces_framework_1.PieceAuth.SecretText({
            displayName: 'Consumer API token',
            description: 'A Consumer API bearer token with credentials:consume scope.',
            required: true,
        }),
    },
});
function readSekalumAuth(value) {
    if (!value || typeof value !== 'object') {
        throw new Error('A valid Sekalum Consumer API connection is required.');
    }
    const candidate = value;
    const consumerApiBaseUrl = candidate.consumerApiBaseUrl;
    const consumerApiToken = candidate.consumerApiToken;
    if (typeof consumerApiBaseUrl !== 'string' || !consumerApiBaseUrl.trim() ||
        typeof consumerApiToken !== 'string' || !consumerApiToken) {
        throw new Error('A valid Sekalum Consumer API connection is required.');
    }
    return { consumerApiBaseUrl, consumerApiToken };
}
