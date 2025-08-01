import type { Emitter } from '@rocket.chat/emitter';

import type { CallEvents } from './CallEvents';

export type CallContact = Record<string, string> | null;

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
