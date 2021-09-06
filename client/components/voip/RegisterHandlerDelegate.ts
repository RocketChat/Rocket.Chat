export interface RegisterHandlerDeligate {

    /**
     * Called when a endpoint is registered
     * @remarks
     * Callback for handling registration success
     */
    onRegistered?(): void;
    /**
     * Called when registration fails.
     * @remarks
     * Callback for handling the registration failure
     */
    onRegistrationError?(reason: any): void;
    /**
     * Called when a endpoint is unregistered
     * @remarks
     * Callback for handling registration success
     */
     onUnregistered?(): void;
     /**
      * Called when unregistered fails.
      * @remarks
      * Callback for handling the unregistered failure
      */
     onUnregistrationError?(reason:any): void;
};