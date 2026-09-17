export declare const resolveCredentialSafely: import("@activepieces/pieces-framework").IAction<import("@activepieces/pieces-framework").CustomAuthProperty<{
    consumerApiBaseUrl: import("@activepieces/pieces-framework").ShortTextProperty<true>;
    consumerApiToken: import("@activepieces/pieces-framework").SecretTextProperty<true>;
}>, {
    credentialKey: import("@activepieces/pieces-framework").ShortTextProperty<true>;
    secretNames: import("@activepieces/pieces-framework").ArrayProperty<true>;
}>;
