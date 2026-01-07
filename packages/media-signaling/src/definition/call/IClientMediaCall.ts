import type { Emitter } from '@rocket.chat/emitter';

import type { CallEvents } from './CallEvents';

export type CallActorType = 'user' | 'sip';

export type CallContact = {
	type?: CallActorType;
	id?: string;
	contractId?: string;

	displayName?: string;
	username?: string;
	sipExtension?: string;
};

export type CallRole = 'caller' | 'callee';

export type CallService = 'webrtc';

export type CallState =
	| 'none' // trying to call with no idea if it'll reach anyone
	| 'ringing' // call has been acknoledged by the callee's agent, but no response about them accepting it or not
	| 'accepted' // call has been accepted and the webrtc offer is being exchanged
	| 'active' // webrtc connection has been established
	| 'renegotiating' // a webrtc connection had been established before, but a new one is being negotiated
	| 'hangup'; // call is over

// Changes to this list must be reflected on the enum for clientMediaSignalHangupSchema too
export type CallHangupReason =
	| 'normal' // User explicitly hanged up
	| 'remote' // The client was told the call is over
	| 'rejected' // The callee rejected the call
	| 'unavailable' // The actor is not available
	| 'transfer' // one of the users requested the other be transferred to someone else
	| 'timeout' // The call state hasn't progressed for too long
	| 'signaling-error' // Hanging up because of an error during the signal processing
	| 'service-error' // Hanging up because of an error setting up the service connection
	| 'media-error' // Hanging up because of an error setting up the media connection
	| 'input-error' // Something wrong with the audio input track on the client
	| 'error' // Hanging up because of an unidentified error
	| 'unknown' // One of the call's signed users reported they don't know this call
	| 'another-client'; // One of the call's users requested a hangup from a different client session than the one where the call is happening

export type CallAnswer =
	| 'accept' // actor accepts the call
	| 'reject' // actor rejects the call
	| 'ack' // agent confirms the actor is reachable
	| 'unavailable'; // agent reports the actor is unavailable

export type CallNotification =
	| 'accepted' // notify that the call has been accepted by both actors
	| 'active' // notify that call activity was confirmed
	| 'hangup'; // notify that the call is over;

export type CallRejectedReason =
	| 'invalid-call-id' // the call id can't be used for a new call
	| 'invalid-contract-id' // this specific contract can't request this call
	| 'existing-call-id' // the call already exists with a different callee or contract
	| 'already-requested' // the request is valid, but a call matching its params is already underway
	| 'unsupported' // no matching supported services between actors
	| 'unavailable' // the callee is unavailable
	| 'busy' // the actor who requested the call is supposedly busy
	| 'invalid-call-params' // something is wrong with the params (eg. no valid route between caller and callee)
	| 'forbidden'; // one of the actors on the call doesn't have permission for it

export type CallFlag = 'internal' | 'create-data-channel';

export interface IClientMediaCall {
	callId: string;
	role: CallRole;
	service: CallService | null;
	flags: readonly CallFlag[];

	state: CallState;
	ignored: boolean;
	signed: boolean;
	hidden: boolean;
	muted: boolean;
	/* if the call was put on hold */
	held: boolean;
	/* busy = state >= 'accepted' && state < 'hangup' */
	busy: boolean;
	/* if the other side has put the call on hold */
	remoteHeld: boolean;
	remoteMute: boolean;

	contact: CallContact;
	transferredBy: CallContact | null;
	audioLevel: number;
	localAudioLevel: number;

	/** if the call was requested by this session, then this will have the ID used to request the call, otherwise it will be the same as callId */
	readonly tempCallId: string;
	/** confirmed indicates if the call exists on the server */
	readonly confirmed: boolean;

	emitter: Emitter<CallEvents>;

	getRemoteMediaStream(): MediaStream | null;

	accept(): void;
	reject(): void;
	hangup(): void;
	setMuted(muted: boolean): void;
	setHeld(onHold: boolean): void;
	transfer(callee: { type: CallActorType; id: string }): void;

	sendDTMF(dtmf: string, duration?: number): void;

	getStats(selector?: MediaStreamTrack | null): Promise<RTCStatsReport | null>;
}
