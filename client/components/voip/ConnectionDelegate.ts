export interface ConnectionDelegate {
    
    /**
     * Called when a connection is establised
     * @remarks
     * Callback for handling connection success
     */
    onConnected?(): void;
    /**
     * Called when connection fails
     * @remarks
     * Callback for handling the connection error
     */
    onConnectionError?(error:any): void;
};