export type ResolvedCredential = Readonly<{
    credentialKey: string;
    values: Readonly<Record<string, string>>;
}>;
export declare function normalizeSecretNames(value: unknown): string[];
export declare function validateResolveResponse(payload: unknown, credentialKey: string, requestedNames: readonly string[]): ResolvedCredential;
