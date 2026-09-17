"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectDiscoveryResponse = projectDiscoveryResponse;
const safe_error_1 = require("./safe-error");
const DISCOVERY_ENTRY_KEYS = ['credentialKey', 'metadata', 'fields', 'runtimePublic'];
function projectDiscoveryResponse(payload) {
    const data = successData(payload);
    const document = asExactRecord(data, ['credentials']);
    if (!Array.isArray(document.credentials)) {
        throw (0, safe_error_1.unexpectedConsumerResponse)();
    }
    return document.credentials.map((credential) => {
        const selection = asAllowedRecord(credential, DISCOVERY_ENTRY_KEYS);
        if (typeof selection.credentialKey !== 'string' || !selection.credentialKey) {
            throw (0, safe_error_1.unexpectedConsumerResponse)();
        }
        return { credentialKey: selection.credentialKey };
    });
}
function successData(payload) {
    const envelope = asExactRecord(payload, ['success', 'meta', 'data']);
    const meta = asExactRecord(envelope.meta, ['apiVersion']);
    if (envelope.success !== true || meta.apiVersion !== 'v1') {
        throw (0, safe_error_1.unexpectedConsumerResponse)();
    }
    return envelope.data;
}
function asExactRecord(value, keys) {
    const record = asRecord(value);
    if (Object.keys(record).length !== keys.length || Object.keys(record).some((key) => !keys.includes(key))) {
        throw (0, safe_error_1.unexpectedConsumerResponse)();
    }
    return record;
}
function asAllowedRecord(value, keys) {
    const record = asRecord(value);
    if (Object.keys(record).some((key) => !keys.includes(key))) {
        throw (0, safe_error_1.unexpectedConsumerResponse)();
    }
    return record;
}
function asRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw (0, safe_error_1.unexpectedConsumerResponse)();
    }
    return value;
}
