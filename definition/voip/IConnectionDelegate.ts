/**
 * Delegate interface connection events while connecting to PBX
 * @remarks
 * This interface is implemented by a class which is
 * interested in handling connection events.
 */
export interface IConnectionDelegate {
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
	onConnectionError?(error: any): void;
}
