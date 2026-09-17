import { createAction, Property } from '@activepieces/pieces-framework';
import { readSekalumAuth, sekalumAuth } from '../auth';
import { ConsumerClient } from '../lib/consumer-client';
import { safeActionMessage } from '../lib/safe-error';

export const resolveCredentialSafely = createAction({
  name: 'resolve_credential_safely',
  displayName: 'Resolve credential safely',
  description: 'Uses selected fields only within this action and never returns their values.',
  auth: sekalumAuth,
  props: {
    credentialKey: Property.ShortText({
      displayName: 'Credential',
      description: 'The opaque credential key returned by Sekalum discovery.',
      required: true,
    }),
    secretNames: Property.Array({
      displayName: 'Fields to use',
      description: 'Exact field names to use. Wildcards are not accepted.',
      required: true,
      properties: {
        name: Property.ShortText({
          displayName: 'Field name',
          description: 'An exact field name.',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    try {
      const auth = readSekalumAuth(context.auth);
      const configuredFields = context.propsValue.secretNames;
      const names = Array.isArray(configuredFields)
        ? configuredFields.map((field) => (
          field && typeof field === 'object'
            ? (field as Record<string, unknown>).name
            : field
        ))
        : configuredFields;
      await new ConsumerClient({
        baseUrl: auth.consumerApiBaseUrl,
        token: auth.consumerApiToken,
      }).resolve(context.propsValue.credentialKey, names);
      return { status: 'resolved' };
    } catch (error) {
      throw new Error(safeActionMessage(error));
    }
  },
});
