import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readSekalumAuth, sekalumAuth } from '../src/auth';
import { safeDiagnostic } from '../src/lib/redaction';
import { safeActionMessage, SafeConsumerError } from '../src/lib/safe-error';

describe('safe local behavior', () => {
  it('T-AP-AUTH-002 rejects an incomplete connection without echoing its values', () => {
    expect(() => readSekalumAuth({ consumerApiBaseUrl: 'https://consumer.example.test' })).toThrow(
      'A valid Sekalum Consumer API connection is required.',
    );
  });

  it('T-SEC-LOG-001 returns only a bounded diagnostic shape', () => {
    expect(safeDiagnostic('resolve', 'failed')).toEqual({ operation: 'resolve', outcome: 'failed' });
  });

  it('T-SEC-URL-001 renders no request URL in controlled failures', () => {
    expect(safeActionMessage(new Error('https://consumer.example.test/not-for-output'))).toBe(
      'The Consumer API request could not be completed safely.',
    );
  });

  it('T-SEC-OUTPUT-001 renders no response payload in controlled failures', () => {
    expect(safeActionMessage(new Error('not-for-output'))).toBe(
      'The Consumer API request could not be completed safely.',
    );
  });

  it('T-AUDIT-001 does not preserve unknown error detail', () => {
    expect(safeActionMessage(new Error('not-for-output'))).not.toContain('not-for-output');
  });

  it('T-AUDIT-ERROR-001 exposes only a canonical public error message', () => {
    expect(safeActionMessage(new SafeConsumerError(403, 'RESOLVE_NOT_AVAILABLE'))).toBe(
      'Resolving this credential is not available.',
    );
  });

  it('T-COMPAT-001 keeps the v1 piece configuration surface stable', () => {
    expect(Object.keys(sekalumAuth.props).sort()).toEqual(['consumerApiBaseUrl', 'consumerApiToken']);
  });

  it('T-BASELINE-001 keeps the packaged source asset byte-identical to the locked canonical digest', () => {
    const asset = readFileSync(resolve(process.cwd(), 'src/assets/sekalum-icon.png'));
    expect(createHash('sha256').update(asset).digest('hex')).toBe(
      '85a1e4fb456abac4c48f9bb19eb1198a0e6e0966e501e978e60869efac3fae52',
    );
  });
});
