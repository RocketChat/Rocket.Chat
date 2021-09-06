export interface ICallEventDelegate {
	/**
	 * Called when a call is received
	 * @remarks
	 * Callback for handling incoming call
	 */
	onIncomingCall?(callingPartyName: string): void;
	/**
	 * Called when call is established
	 * @remarks
	 * Callback for handling call established
	 */
	onCallEstablished?(): void;

	/**
	 * Called when call is terminated
	 * @remarks
	 * Callback for handling call termination
	 */
	onCallTermination?(): void;
}
