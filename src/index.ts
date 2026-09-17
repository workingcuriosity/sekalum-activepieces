import { createPiece } from '@activepieces/pieces-framework';
import { discoverCredentials } from './actions/discover-credentials';
import { resolveCredentialSafely } from './actions/resolve-credential-safely';
import { sekalumAuth } from './auth';

export const sekalum = createPiece({
  displayName: 'Sekalum',
  description: 'Use only server-authorized Sekalum Consumer API credentials.',
  logoUrl: './assets/sekalum-icon.png',
  authors: ['Sekalum'],
  minimumSupportedRelease: '0.82.0',
  auth: sekalumAuth,
  actions: [discoverCredentials, resolveCredentialSafely],
  triggers: [],
});
