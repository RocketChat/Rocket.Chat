import type { CallHangupReason, CallRole, CallService } from './call';

export type MediaSignalHeader = {
	callId: string;
	sessionId?: string;
};

// Sent by the server to notify an agent that there's a new call for their actor
export type MediaSignalNewCall = {
	service: CallService;
	kind: 'direct';
	role: CallRole;
};

// Sent by both the agent and the server to deliver an SDP to the other
// the SDP might be an offer or an answer. If it's an offer, the sender will be waiting for an answer from the receiver
export type MediaSignalSDP = {
	sdp: RTCSessionDescriptionInit;
	// endOfCandidates: boolean;
};

// Sent by the server to request a WebRTC offer from an agent
export type MediaSignalRequestOffer = {
	iceRestart?: boolean;
};

// Sent by an agent to notify the server that something failed
export type MediaSignalError = {
	errorCode: string;
};

// Sent by an agent to notify the server that the user accepted or rejected a call, or simply to report a status before for that user
export type MediaSignalAnswer = {
	answer:
		| 'accept' // the user has accepted the call
		| 'reject' // the user has rejected the call
		| 'ack' // pre-answer notifying that the agent can reach the user, a new answer will be sent later
		| 'unavailable'; // the user is busy, or the agent can't reach them
};

// Sent by an agent to notify the server that it had to hangup from a call. The reason specifies if its a clean hangup or an error
export type MediaSignalHangup = {
	reason: CallHangupReason;
};

// Simple notifications sent by the server to the agents
export type MediaSignalNotification = {
	notification:
		| 'accepted' // notify that the call has been accepted by both actors
		| 'hangup'; // notify that the call is over;
};

export type MediaSignalMap = {
	'new': MediaSignalNewCall;
	'sdp': MediaSignalSDP;
	'request-offer': MediaSignalRequestOffer;
	'error': MediaSignalError;
	'answer': MediaSignalAnswer;
	'hangup': MediaSignalHangup;
	'notification': MediaSignalNotification;
};

export type MediaSignalType = keyof MediaSignalMap;

export type MediaSignalBody<T extends MediaSignalType = MediaSignalType> = MediaSignalMap[T];

export type MediaSignalBodyAndType<T extends MediaSignalType = MediaSignalType> = { type: T; body: MediaSignalBody<T> };

export type MediaSignal<T extends MediaSignalType = MediaSignalType> = MediaSignalHeader & MediaSignalBodyAndType<T>;
