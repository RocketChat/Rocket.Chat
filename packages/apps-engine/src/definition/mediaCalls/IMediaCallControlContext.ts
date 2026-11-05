import type { IMediaCall, IMediaCallContact } from './IMediaCall';

/**
 * Contexts passed to an app's media-call control methods. Rocket.Chat dispatches these to the apps
 * that implement `IMediaCallHandler` when a `cti` call it is tracking needs an action performed on
 * the external device/gateway. The app that owns the call (it dialed it, or provided the device)
 * acts on it; other apps ignore calls they do not own.
 */

/** The user whose devices are being listed (for `executeGetMediaCallDevices`). */
export interface IMediaCallDevicesContext {
	userId: string;
}

/** Originate an outbound call on the given device towards the call's callee. */
export interface IMediaCallDialContext {
	call: IMediaCall;
	/** The device (from `executeGetMediaCallDevices`) the call must be placed on. */
	device: string;
}

/** Answer an inbound call the app previously reported. */
export interface IMediaCallAnswerContext {
	call: IMediaCall;
}

export interface IMediaCallHangupContext {
	call: IMediaCall;
	reason?: string;
}

export interface IMediaCallMuteContext {
	call: IMediaCall;
	muted: boolean;
}

export interface IMediaCallHoldContext {
	call: IMediaCall;
	held: boolean;
}

export interface IMediaCallTransferContext {
	call: IMediaCall;
	to: IMediaCallContact;
}

/**
 * Complete an attended transfer: connect the party on the held call with the party of the consultation
 * call. The app reports both calls as ended once the gateway has done it.
 */
export interface IMediaCallCompleteTransferContext {
	/** The call that was put on hold to consult before transferring it. */
	heldCall: IMediaCall;
	/** The call placed to the transfer target while `heldCall` waits. */
	consultationCall: IMediaCall;
}

export interface IMediaCallDtmfContext {
	call: IMediaCall;
	tone: string;
	duration: number;
}
