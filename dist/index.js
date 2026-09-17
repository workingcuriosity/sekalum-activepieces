"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sekalum = void 0;
const pieces_framework_1 = require("@activepieces/pieces-framework");
const discover_credentials_1 = require("./actions/discover-credentials");
const resolve_credential_safely_1 = require("./actions/resolve-credential-safely");
const auth_1 = require("./auth");
exports.sekalum = (0, pieces_framework_1.createPiece)({
    displayName: 'Sekalum',
    description: 'Use only server-authorized Sekalum Consumer API credentials.',
    logoUrl: './assets/sekalum-icon.png',
    authors: ['Sekalum'],
    minimumSupportedRelease: '0.82.0',
    auth: auth_1.sekalumAuth,
    actions: [discover_credentials_1.discoverCredentials, resolve_credential_safely_1.resolveCredentialSafely],
    triggers: [],
});
