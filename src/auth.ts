import { PieceAuth, Property } from '@activepieces/pieces-framework';

/**
 * Activepieces retains this connection. The piece itself has no credential,
 * secret, cache, or refresh store.
 */
export const sekalumAuth = PieceAuth.CustomAuth({
  displayName: 'Sekalum Consumer API',
  description: 'Connect with a Sekalum Consumer API token.',
  required: true,
  props: {
    consumerApiBaseUrl: Property.ShortText({
      displayName: 'Consumer API base URL',
      description: 'The base URL of the Sekalum Consumer API.',
      required: true,
    }),
    consumerApiToken: PieceAuth.SecretText({
      displayName: 'Consumer API token',
      description: 'A Consumer API bearer token with credentials:consume scope.',
      required: true,
    }),
  },
});

export type SekalumAuthValue = {
  consumerApiBaseUrl: string;
  consumerApiToken: string;
};

export function readSekalumAuth(value: unknown): SekalumAuthValue {
  if (!value || typeof value !== 'object') {
    throw new Error('A valid Sekalum Consumer API connection is required.');
  }

  const candidate = value as Record<string, unknown>;
  const consumerApiBaseUrl = candidate.consumerApiBaseUrl;
  const consumerApiToken = candidate.consumerApiToken;
  if (
    typeof consumerApiBaseUrl !== 'string' || !consumerApiBaseUrl.trim() ||
    typeof consumerApiToken !== 'string' || !consumerApiToken
  ) {
    throw new Error('A valid Sekalum Consumer API connection is required.');
  }

  return { consumerApiBaseUrl, consumerApiToken };
}
