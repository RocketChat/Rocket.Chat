export interface IInternalFederationBridge {
    /**
     * Get Federation's private key.
     * For apps engine's internal use
     *
     */
    getPrivateKey(): Promise<string | null>;

    /**
     * Get Federation's public key.
     * For apps engine's internal use
     *
     */
    getPublicKey(): Promise<string | null>;
}
