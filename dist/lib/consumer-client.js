"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsumerClient = void 0;
const discovery_projection_1 = require("./discovery-projection");
const resolve_validation_1 = require("./resolve-validation");
const safe_error_1 = require("./safe-error");
/** Consumer API client with no persistence, logging, telemetry, or response cache. */
class ConsumerClient {
    baseUrl;
    token;
    fetchImplementation;
    constructor(options) {
        this.baseUrl = normalizeBaseUrl(options.baseUrl);
        if (!options.token) {
            throw (0, safe_error_1.unexpectedConsumerResponse)();
        }
        this.token = options.token;
        this.fetchImplementation = options.fetch ?? globalThis.fetch;
    }
    async discover() {
        const payload = await this.request('api/v1/consumer/credentials', { method: 'GET' });
        return (0, discovery_projection_1.projectDiscoveryResponse)(payload);
    }
    async resolve(credentialKey, secretNames) {
        if (typeof credentialKey !== 'string' || !credentialKey) {
            throw (0, safe_error_1.unexpectedConsumerResponse)();
        }
        const normalizedNames = (0, resolve_validation_1.normalizeSecretNames)(secretNames);
        const encodedCredentialKey = encodeURIComponent(credentialKey);
        const payload = await this.request(`api/v1/consumer/credentials/${encodedCredentialKey}/resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secretNames: normalizedNames }),
        });
        return (0, resolve_validation_1.validateResolveResponse)(payload, credentialKey, normalizedNames);
    }
    async request(path, init) {
        let response;
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
        }
        catch {
            throw (0, safe_error_1.unexpectedConsumerResponse)();
        }
        const payload = await parseJson(response);
        if (!response.ok) {
            throw (0, safe_error_1.safeErrorFromResponse)(response.status, payload);
        }
        return payload;
    }
}
exports.ConsumerClient = ConsumerClient;
function normalizeBaseUrl(value) {
    let parsed;
    try {
        parsed = new URL(value);
    }
    catch {
        throw (0, safe_error_1.unexpectedConsumerResponse)();
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw (0, safe_error_1.unexpectedConsumerResponse)();
    }
    parsed.hash = '';
    parsed.search = '';
    return parsed.toString().replace(/\/$/, '');
}
async function parseJson(response) {
    try {
        return await response.json();
    }
    catch {
        throw (0, safe_error_1.unexpectedConsumerResponse)();
    }
}
