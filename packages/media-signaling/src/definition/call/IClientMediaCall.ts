import type { Emitter } from '@rocket.chat/emitter';

import type { CallEvents } from './CallEvents';

export type CallActorType = 'user' | 'sip';

export type CallContact = {
	type?: CallActorType;
	id?: string;
	displayName?: string;
	username?: string;
	sipExtension?: string;
	avatarUrl?: string;
	host?: string;
};

export type CallRole = 'caller' | 'callee';

export type CallService = 'webrtc';

export type CallState =
	| 'none' // trying to call with no idea if it'll reach anyone
	| 'ringing' // call has been acknoledged by the callee's agent, but no response about them accepting it or not
	| 'accepted' // call has been accepted and the webrtc offer is being exchanged
	| 'active' // webrtc connection has been established
	| 'hangup'; // call is over

export type CallHangupReason =
	| 'normal' // User explicitly hanged up
	| 'remote' // Server told the client to hang up
	| 'rejected' // The callee rejected the call
	| 'unavailable' // The actor is not available
	| 'timeout' // The call state hasn't progressed for too long
	| 'signaling-error' // Hanging up because of an error during the signal processing
	| 'service-error' // Hanging up because of an error setting up the service connection
	| 'media-error' // Hanging up because of an error setting up the media connection
	| 'error'; // Hanging up because of an unidentified error

export type CallAnswer =
	| 'accept' // actor accepts the call
	| 'reject' // actor rejects the call
	| 'ack' // agent confirms the actor is reachable
	| 'unavailable'; // agent reports the actor is unavailable

export type CallNotification =
	| 'accepted' // notify that the call has been accepted by both actors
	| 'hangup'; // notify that the call is over;

export type CallRejectedReason =
	| 'invalid-call-id' // the call id can't be used for a new call
	| 'invalid-contract-id' // this specific contract can't request this call
	| 'existing-call-id' // the call already exists with a different callee or contract
	| 'already-requested' // the request is valid, but a call matching its params is already underway
	| 'unsupported'; // no matching supported services between actors

export interface IClientMediaCallData {
	callId: string;
	role: CallRole;
	service: CallService | null;

	state?: CallState;
	ignored?: boolean;

	contact?: CallContact;
}

export interface IClientMediaCall extends Required<IClientMediaCallData> {
	emitter: Emitter<CallEvents>;

	getRemoteMediaStream(): MediaStream;

	accept(): Promise<void>;
	reject(): Promise<void>;
	hangup(): Promise<void>;
}
