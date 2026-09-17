"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoverCredentials = void 0;
const pieces_framework_1 = require("@activepieces/pieces-framework");
const auth_1 = require("../auth");
const consumer_client_1 = require("../lib/consumer-client");
const safe_error_1 = require("../lib/safe-error");
exports.discoverCredentials = (0, pieces_framework_1.createAction)({
    name: 'discover_credentials',
    displayName: 'Discover credentials',
    description: 'Lists the server-authorized Sekalum credentials available to this connection.',
    auth: auth_1.sekalumAuth,
    props: {},
    async run(context) {
        try {
            const auth = (0, auth_1.readSekalumAuth)(context.auth);
            const credentials = await new consumer_client_1.ConsumerClient({
                baseUrl: auth.consumerApiBaseUrl,
                token: auth.consumerApiToken,
            }).discover();
            return { credentials };
        }
        catch (error) {
            throw new Error((0, safe_error_1.safeActionMessage)(error));
        }
    },
});
