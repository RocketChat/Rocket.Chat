import type { CallContact, CallHangupReason, CallNotification, CallRole, CallService } from './call';

// Sent by the server to notify an agent that there's a new call for their actor
export type MediaSignalNewCall = {
	callId: string;
	type: 'new';

	service: CallService;
	kind: 'direct';
	role: CallRole;
	contact: CallContact;
};

// Sent by both the agent and the server to deliver an SDP to the other
// the SDP might be an offer or an answer. If it's an offer, the sender will be waiting for an answer from the receiver
export type MediaSignalSDP = {
	callId: string;
	contractId: string;
	type: 'sdp';

	sdp: RTCSessionDescriptionInit;
};

// Sent by the server to request a WebRTC offer from an agent
export type MediaSignalRequestOffer = {
	callId: string;
	contractId: string;
	type: 'request-offer';

	iceRestart?: boolean;
};

// Sent by an agent to notify the server that something failed
export type MediaSignalError = {
	callId: string;
	contractId: string;
	type: 'error';

	errorCode: string;
};

// Sent by an agent to notify the server that the user accepted or rejected a call, or simply to report a status before for that user
export type MediaSignalAnswer = {
	callId: string;
	type: 'answer';
	contractId: string;

	answer:
		| 'accept' // the user has accepted the call
		| 'reject' // the user has rejected the call
		| 'ack' // pre-answer notifying that the agent can reach the user, a new answer will be sent later
		| 'unavailable'; // the user is busy, or the agent can't reach them
};

// Sent by an agent to notify the server that it had to hangup from a call. The reason specifies if its a clean hangup or an error
export type MediaSignalHangup = {
	callId: string;
	contractId: string;
	type: 'hangup';

	reason: CallHangupReason;
};

// Simple notifications sent by the server to the agents
export type MediaSignalNotification = {
	callId: string;
	contractId?: string;
	type: 'notification';

	notification: CallNotification;
};

type ExtractMediaSignal<T, K> = T extends { type: K } ? T : never;

export type AnyMediaSignal =
	| MediaSignalError
	| MediaSignalAnswer
	| MediaSignalHangup
	| MediaSignalSDP
	| MediaSignalNewCall
	| MediaSignalRequestOffer
	| MediaSignalNotification;

export type MediaSignalType = AnyMediaSignal['type'];

export type MediaSignal<K extends MediaSignalType = MediaSignalType> = ExtractMediaSignal<AnyMediaSignal, K>;

export type AgentMediaSignal = MediaSignal<'error' | 'answer' | 'hangup' | 'sdp'>;

export type ServerMediaSignal = MediaSignal<'sdp' | 'new' | 'request-offer' | 'notification'>;

export type AgentMediaSignalType = AgentMediaSignal['type'];

export type ServerMediaSignalType = ServerMediaSignal['type'];

type RemoveContractId<T extends MediaSignal> = T extends { contractId: string } ? Omit<T, 'contractId'> : T;

export type MediaSignalBody<K extends MediaSignalType = MediaSignalType> = Omit<RemoveContractId<MediaSignal<K>>, 'callId' | 'type'>;

export type MediaSignalBodyAndType<K extends MediaSignalType = MediaSignalType> = Omit<RemoveContractId<MediaSignal<K>>, 'callId'>;
