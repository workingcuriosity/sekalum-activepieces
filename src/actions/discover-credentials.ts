import { createAction } from '@activepieces/pieces-framework';
import { readSekalumAuth, sekalumAuth } from '../auth';
import { ConsumerClient } from '../lib/consumer-client';
import { safeActionMessage } from '../lib/safe-error';

export const discoverCredentials = createAction({
  name: 'discover_credentials',
  displayName: 'Discover credentials',
  description: 'Lists the server-authorized Sekalum credentials available to this connection.',
  auth: sekalumAuth,
  props: {},
  async run(context) {
    try {
      const auth = readSekalumAuth(context.auth);
      const credentials = await new ConsumerClient({
        baseUrl: auth.consumerApiBaseUrl,
        token: auth.consumerApiToken,
      }).discover();
      return { credentials };
    } catch (error) {
      throw new Error(safeActionMessage(error));
    }
  },
});
