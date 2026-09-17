"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCredentialSafely = void 0;
const pieces_framework_1 = require("@activepieces/pieces-framework");
const auth_1 = require("../auth");
const consumer_client_1 = require("../lib/consumer-client");
const safe_error_1 = require("../lib/safe-error");
exports.resolveCredentialSafely = (0, pieces_framework_1.createAction)({
    name: 'resolve_credential_safely',
    displayName: 'Resolve credential safely',
    description: 'Uses selected fields only within this action and never returns their values.',
    auth: auth_1.sekalumAuth,
    props: {
        credentialKey: pieces_framework_1.Property.ShortText({
            displayName: 'Credential',
            description: 'The opaque credential key returned by Sekalum discovery.',
            required: true,
        }),
        secretNames: pieces_framework_1.Property.Array({
            displayName: 'Fields to use',
            description: 'Exact field names to use. Wildcards are not accepted.',
            required: true,
            properties: {
                name: pieces_framework_1.Property.ShortText({
                    displayName: 'Field name',
                    description: 'An exact field name.',
                    required: true,
                }),
            },
        }),
    },
    async run(context) {
        try {
            const auth = (0, auth_1.readSekalumAuth)(context.auth);
            const configuredFields = context.propsValue.secretNames;
            const names = Array.isArray(configuredFields)
                ? configuredFields.map((field) => (field && typeof field === 'object'
                    ? field.name
                    : field))
                : configuredFields;
            await new consumer_client_1.ConsumerClient({
                baseUrl: auth.consumerApiBaseUrl,
                token: auth.consumerApiToken,
            }).resolve(context.propsValue.credentialKey, names);
            return { status: 'resolved' };
        }
        catch (error) {
            throw new Error((0, safe_error_1.safeActionMessage)(error));
        }
    },
});
