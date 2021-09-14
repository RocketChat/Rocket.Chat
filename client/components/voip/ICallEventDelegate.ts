/**
 * Delegate interface for Call Events
 * @remarks
 * This interface is implemented by a class which is
 * interested in handling call events.
 */
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
