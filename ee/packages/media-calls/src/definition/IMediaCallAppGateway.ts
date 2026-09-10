import type { MediaCallContact } from '@rocket.chat/core-typings';
import type { CallFeature, CallHangupReason } from '@rocket.chat/media-signaling';

/** Control/state events an app reports back for a cti call it is handling (app -> host). */
export type CtiCallStateEvent =
	| { type: 'ringing' }
	| { type: 'answered'; features?: CallFeature[] }
	| { type: 'active' }
	| { type: 'ended'; reason?: CallHangupReason }
	| { type: 'state'; muted?: boolean; held?: boolean; remoteMuted?: boolean; remoteHeld?: boolean };

/** An external endpoint (e.g. a desk phone) a user can place/receive `cti` calls on, provided by an app. */
export type MediaCallDevice = {
	/** Opaque device id, unique within the providing app. */
	id: string;
	/** Human-readable device name shown in the device picker. */
	name: string;
	/** The app that owns this device and will handle its calls. */
	appId: string;
};

/**
 * Dispatches `cti` call control to the app/gateway that owns the call's device.
 *
 * This is the seam between the media-calls engine and the apps-engine: the engine calls these
 * methods (from `CtiActorAgent`) and the host (`apps/meteor`) injects an implementation that
 * forwards them to the right app via the apps-engine runtime. All control methods take a `callId`;
 * the implementation loads the call, resolves its `device` to the owning app, and dispatches there.
 *
 * Calls are expected to be idempotent where it matters (e.g. `hangup` on an already-ended call),
 * so the app must tolerate a control command that races with its own reported state.
 */
export interface IMediaCallAppGateway {
	/** Lists the devices a user may place/receive cti calls on, aggregated across cti-capable apps. */
	getDevices(uid: string): Promise<MediaCallDevice[]>;

	/** Originate an outbound call on the caller's device towards the call's callee. */
	dial(callId: string): Promise<void>;
	/** Answer an inbound call on the callee's device. */
	answer(callId: string): Promise<void>;
	hangup(callId: string, reason?: string): Promise<void>;
	mute(callId: string, muted: boolean): Promise<void>;
	hold(callId: string, held: boolean): Promise<void>;
	transfer(callId: string, to: MediaCallContact): Promise<void>;
	sendDTMF(callId: string, dtmf: string, duration: number): Promise<void>;
}
