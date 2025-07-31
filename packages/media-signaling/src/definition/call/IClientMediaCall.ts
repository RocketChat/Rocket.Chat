import type { Emitter } from '@rocket.chat/emitter';

import type { CallEvents } from './CallEvents';

export type CallContact = Record<string, string> | null;

export type CallRole = 'caller' | 'callee';

export type CallService = 'webrtc';

export type CallState = 'none' | 'ringing' | 'accepted' | 'active' | 'hangup' | 'error';

export type CallHangupReason =
	| 'normal' // User explicitly hanged up
	| 'remote' // Server told the client to hang up
	| 'unavailable' // The opposite actor is not available
	| 'signaling-error' // Hanging up because of an error during the signal processing
	| 'service-error' // Hanging up because of an error setting up the service connection
	| 'media-error' // Hanging up because of an error setting up the media connection
	| 'error'; // Hanging up because of an unidentified error

export interface IClientMediaCallData {
	callId: string;
	role: CallRole;
	service: CallService;

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

export function isCallRole(role: string): role is CallRole {
	return ['caller', 'callee'].includes(role);
}
