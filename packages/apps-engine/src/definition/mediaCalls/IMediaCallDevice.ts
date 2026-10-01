/**
 * An external endpoint (e.g. a desk phone) that a user can place or receive `cti` media calls on.
 * Returned by an app's `executeGetMediaCallDevices`; Rocket.Chat shows these in the call device picker.
 */
export interface IMediaCallDevice {
	/** Opaque device id, unique within the app. Rocket.Chat passes it back on `dial` and stores it on the call. */
	id: string;
	/** Human-readable device name shown to the user. */
	name: string;
}
