/**
 * Activepieces retains this connection. The piece itself has no credential,
 * secret, cache, or refresh store.
 */
export declare const sekalumAuth: import("@activepieces/pieces-framework").CustomAuthProperty<{
    consumerApiBaseUrl: import("@activepieces/pieces-framework").ShortTextProperty<true>;
    consumerApiToken: import("@activepieces/pieces-framework").SecretTextProperty<true>;
}>;
export type SekalumAuthValue = {
    consumerApiBaseUrl: string;
    consumerApiToken: string;
};
export declare function readSekalumAuth(value: unknown): SekalumAuthValue;
