/**
 * The adapter deliberately never formats consumer inputs or response payloads.
 * These helpers make the only supported diagnostic surface explicit.
 */
export type SafeDiagnostic = Readonly<{
  operation: 'discovery' | 'resolve';
  outcome: 'completed' | 'failed';
}>;

export function safeDiagnostic(
  operation: SafeDiagnostic['operation'],
  outcome: SafeDiagnostic['outcome'],
): SafeDiagnostic {
  return { operation, outcome };
}
