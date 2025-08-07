import type { CallAnswer, CallHangupReason, CallService } from '../../call';

export type ClientMediaSignalRequestCall = {
	// the callId on this signal is temporary and is never propagated to other agents
	callId: string;
	contractId: string;
	type: 'request-call';
	callee: {
		type: 'user' | 'sip';
		id: string;
	};
	supportedServices: CallService[];
};

// Client is sending the local session description to the server
export type ClientMediaSignalLocalSDP = {
	callId: string;
	contractId: string;
	type: 'local-sdp';

	sdp: RTCSessionDescriptionInit;
};

// Client is reporting an error
export type ClientMediaSignalError = {
	callId: string;
	contractId: string;
	type: 'error';

	errorCode: string;
};

// Client is saying that the user accepted or rejected a call, or simply reporting that the user can or can't be reached
export type ClientMediaSignalAnswer = {
	callId: string;
	type: 'answer';
	contractId: string;

	answer: CallAnswer;
};

// Client is saying they hanged up from a call. The reason specifies if its a clean hangup or an error
export type ClientMediaSignalHangup = {
	callId: string;
	contractId: string;
	type: 'hangup';

	reason: CallHangupReason;
};

export type ClientMediaSignal =
	| ClientMediaSignalLocalSDP
	| ClientMediaSignalError
	| ClientMediaSignalAnswer
	| ClientMediaSignalHangup
	| ClientMediaSignalRequestCall;

export type ClientMediaSignalType = ClientMediaSignal['type'];

type ExtractMediaSignal<T, K extends ClientMediaSignalType> = T extends { type: K } ? T : never;

export type GenericClientMediaSignal<K extends ClientMediaSignalType> = ExtractMediaSignal<ClientMediaSignal, K>;

export type ClientMediaSignalBody<K extends ClientMediaSignalType = ClientMediaSignalType> = Omit<
	GenericClientMediaSignal<K>,
	'callId' | 'contractId' | 'type'
>;
