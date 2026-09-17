"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSecretNames = normalizeSecretNames;
exports.validateResolveResponse = validateResolveResponse;
const safe_error_1 = require("./safe-error");
function normalizeSecretNames(value) {
    if (!Array.isArray(value) || value.length === 0) {
        throw (0, safe_error_1.unexpectedConsumerResponse)();
    }
    const names = value.map((name) => {
        if (typeof name !== 'string' || !name.trim() || name.includes('*')) {
            throw (0, safe_error_1.unexpectedConsumerResponse)();
        }
        return name;
    });
    if (new Set(names).size !== names.length) {
        throw (0, safe_error_1.unexpectedConsumerResponse)();
    }
    return names;
}
function validateResolveResponse(payload, credentialKey, requestedNames) {
    const envelope = asExactRecord(payload, ['success', 'meta', 'data']);
    const meta = asExactRecord(envelope.meta, ['apiVersion']);
    if (envelope.success !== true || meta.apiVersion !== 'v1') {
        throw (0, safe_error_1.unexpectedConsumerResponse)();
    }
    const document = asExactRecord(envelope.data, ['credentialKey', 'providerKey', 'lifecycleState', 'secrets']);
    if (document.credentialKey !== credentialKey ||
        typeof document.providerKey !== 'string' || !document.providerKey ||
        document.lifecycleState !== 'active' ||
        !isRecord(document.secrets)) {
        throw (0, safe_error_1.unexpectedConsumerResponse)();
    }
    const values = document.secrets;
    const keys = Object.keys(values);
    if (keys.length !== requestedNames.length ||
        keys.some((name) => !requestedNames.includes(name) || typeof values[name] !== 'string')) {
        throw (0, safe_error_1.unexpectedConsumerResponse)();
    }
    const safeValues = {};
    for (const name of requestedNames) {
        safeValues[name] = values[name];
    }
    return { credentialKey, values: safeValues };
}
function asExactRecord(value, keys) {
    if (!isRecord(value)) {
        throw (0, safe_error_1.unexpectedConsumerResponse)();
    }
    if (Object.keys(value).length !== keys.length || Object.keys(value).some((key) => !keys.includes(key))) {
        throw (0, safe_error_1.unexpectedConsumerResponse)();
    }
    return value;
}
function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
