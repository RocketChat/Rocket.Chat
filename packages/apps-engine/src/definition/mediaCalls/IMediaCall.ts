import type { MediaCallHangupReason } from './MediaCallHangupReason';

/** A media-call capability, e.g. `'audio'`, `'video'`, `'screen-share'`. */
export type MediaCallFeature = string;

/** Media calls happen between workspace users and/or external SIP endpoints. */
export type MediaCallActorType = 'user' | 'sip';

/** The states a call may be persisted in. */
export type MediaCallState = 'none' | 'ringing' | 'accepted' | 'active' | 'hangup';

/**
 * How a call reaches the outside world, and which side opened it. A call between
 * two workspace users is `'internal'` unless the workspace routes internal calls
 * through the PBX, in which case the leg Rocket.Chat sends out is
 * `'sip-outbound'` like any other external call.
 */
export type MediaCallOrigin = 'internal' | 'sip-outbound' | 'sip-inbound';

/**
 * Whoever acted on a call. `'server'` covers the transitions that have no human
 * actor behind them — expiration, internal errors and forced hangups.
 */
export interface IMediaCallActor {
	type: MediaCallActorType | 'server';
	id: string;
}

/**
 * One of the two sides of a call. Either side may be an external SIP endpoint
 * instead of a workspace user, so always check `type` before treating `id` as a
 * user id.
 *
 * The per-session signing token of the contact is deliberately absent: it is a
 * credential, and it never crosses into an app.
 */
export interface IMediaCallContact {
	type: MediaCallActorType;
	id: string;
	username?: string;
	displayName?: string;
	sipExtension?: string;
}

/**
 * A media call — the 1:1 direct audio/video calls between two contacts, as
 * opposed to a video conference. Read-only snapshot of the call as it was when
 * the event was emitted.
 */
export interface IMediaCall {
	id: string;
	service: 'webrtc';
	kind: 'direct';
	state: MediaCallState;

	/** Whether the call travels over the PBX, and which side opened it. */
	origin: MediaCallOrigin;

	/** Who requested the call — the caller, except on transfers. */
	createdBy: IMediaCallContact;
	createdAt: Date;

	caller: IMediaCallContact;
	callee: IMediaCallContact;

	/** The features this call may use. Values are final once the call is accepted. */
	features: MediaCallFeature[];

	/** Ids of the workspace users on the call; external SIP endpoints are not listed here. */
	uids: string[];

	ended: boolean;
	endedAt?: Date;
	endedBy?: IMediaCallActor;
	/** Why the call ended. The known values are not exhaustive — see {@link MediaCallHangupReason}. */
	hangupReason?: MediaCallHangupReason;

	/** When the callee accepted the call. */
	acceptedAt?: Date;
	/** When either side first reported media flowing. */
	activatedAt?: Date;

	/** Set when this call replaced another one through a transfer. */
	parentCallId?: string;

	/**
	 * The party whose line diverted the call, when the call reached its callee
	 * because the PBX forwarded it. A diversion is not a transfer: the call has no
	 * `parentCallId`, because there is no earlier call it replaced. Clients label a
	 * diverted call as transferred by this contact, so an app that reconciles what
	 * the user sees should read it the same way.
	 */
	divertedBy?: IMediaCallContact;
}

/**
 * A call snapshot taken once media was flowing, so `activatedAt` is set. It is
 * the call as the update that emitted the event wrote it, not as the call stands
 * now — a call that ended a moment later still reports the state it started in.
 */
export type IActiveMediaCall = Omit<IMediaCall, 'activatedAt'> & { activatedAt: Date };

/** A call snapshot taken once the callee accepted, so `acceptedAt` is set. */
export type IAcceptedMediaCall = Omit<IMediaCall, 'acceptedAt'> & { acceptedAt: Date };

/** A call snapshot taken after the call ended, so `ended` and `endedAt` are set. */
export type IEndedMediaCall = Omit<IMediaCall, 'ended' | 'endedAt'> & { ended: true; endedAt: Date };
