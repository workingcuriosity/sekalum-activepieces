import { describe, expect, it } from 'vitest';
import { discoverCredentials } from '../src/actions/discover-credentials';
import { resolveCredentialSafely } from '../src/actions/resolve-credential-safely';
import { sekalumAuth } from '../src/auth';
import { sekalum } from '../src/index';

describe('Activepieces piece definition', () => {
  it('T-AP-ARCH-001 registers the two stable asynchronous actions', async () => {
    expect(Object.keys(sekalum.actions()).sort()).toEqual(['discover_credentials', 'resolve_credential_safely']);
    await expect(discoverCredentials.run).toBeTypeOf('function');
    await expect(resolveCredentialSafely.run).toBeTypeOf('function');
  });

  it('T-AP-AUTH-001 defines the token input as SecretText in the shared connection', () => {
    expect(sekalumAuth.type).toBe('CUSTOM_AUTH');
    expect(sekalumAuth.props.consumerApiToken.type).toBe('SECRET_TEXT');
    expect(sekalum.auth).toBe(sekalumAuth);
    expect(discoverCredentials.requireAuth).toBe(true);
    expect(resolveCredentialSafely.requireAuth).toBe(true);
  });

  it('T-BATCH-SCOPE-001 exposes no batch action', () => {
    expect(Object.keys(sekalum.actions())).not.toContain('resolve_batch');
  });

  it('T-AP-BRAND-001 uses the packaged canonical Sekalum asset path', () => {
    expect(sekalum.logoUrl).toBe('./assets/sekalum-icon.png');
  });

  it('T-AP-COMPAT-001 declares the current Activepieces context-v2 release floor', () => {
    expect(sekalum.minimumSupportedRelease).toBe('0.82.0');
  });
});
