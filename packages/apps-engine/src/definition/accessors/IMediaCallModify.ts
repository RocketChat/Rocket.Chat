import type { IMediaCallContact } from '../mediaCalls/IMediaCall';

export interface IMediaCallIncomingCallParams {
	/** The Rocket.Chat user the call is arriving for. */
	userId: string;
	/** Who is calling (the external party), as the app knows them. */
	from: IMediaCallContact;
	/** The device the call is arriving on. */
	device?: string;
	/** Features available on this call (e.g. `['audio','hold','transfer']`). */
	features?: string[];
}

export interface IMediaCallReportedState {
	muted?: boolean;
	held?: boolean;
	remoteMuted?: boolean;
	remoteHeld?: boolean;
}

/**
 * Lets an app that handles `cti` calls push call events back into Rocket.Chat: report an inbound call
 * arriving on a user's device, and report progress/state of a call it is handling. This is the
 * counterpart to the control methods on `IMediaCallHandler` (Rocket.Chat -> app); these are app ->
 * Rocket.Chat.
 */
export interface IMediaCallModify {
	/** Ring a Rocket.Chat user for a call arriving on their device. Returns nothing; state is reported separately. */
	createIncomingCall(params: IMediaCallIncomingCallParams): Promise<void>;

	/** The call is now ringing on the device. */
	reportRinging(callId: string): Promise<void>;
	/** The call was answered on/by the remote side. */
	reportAnswered(callId: string, features?: string[]): Promise<void>;
	/** Media is now flowing on the call. */
	reportActive(callId: string): Promise<void>;
	/** The call ended. */
	reportEnded(callId: string, reason?: string): Promise<void>;
	/** Report the current mute/hold state of either leg, to reflect it in the Rocket.Chat call widget. */
	reportState(callId: string, state: IMediaCallReportedState): Promise<void>;

	/**
	 * Tell Rocket.Chat that the set of devices this user can be reached on has changed, so that it asks
	 * for the list again. Only the app knows when one is added, removed or renamed, so without this the
	 * user has to reload before a new device can be picked.
	 */
	notifyDevicesChanged(userId: string): Promise<void>;
}
