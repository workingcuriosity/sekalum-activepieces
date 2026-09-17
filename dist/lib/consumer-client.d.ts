import { type CredentialSelection } from './discovery-projection';
import { type ResolvedCredential } from './resolve-validation';
export type ConsumerClientOptions = Readonly<{
    baseUrl: string;
    token: string;
    fetch?: typeof globalThis.fetch;
}>;
/** Consumer API client with no persistence, logging, telemetry, or response cache. */
export declare class ConsumerClient {
    private readonly baseUrl;
    private readonly token;
    private readonly fetchImplementation;
    constructor(options: ConsumerClientOptions);
    discover(): Promise<CredentialSelection[]>;
    resolve(credentialKey: string, secretNames: unknown): Promise<ResolvedCredential>;
    private request;
}
