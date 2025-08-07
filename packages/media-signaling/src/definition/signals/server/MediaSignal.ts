import type { CallContact, CallNotification, CallRole, CallService } from '../../call';

// Sent by the server to notify an agent that there's a new call for their actor
export type ServerMediaSignalNewCall = {
	callId: string;
	type: 'new';

	service: CallService;
	kind: 'direct';
	role: CallRole;
	contact: CallContact;

	// This will only be sent to the caller, with the id it used to request this call
	requestedCallId?: string;
};

// Server is sending the other actor's sdp
export type ServerMediaSignalRemoteSDP = {
	callId: string;
	toContractId: string;
	type: 'remote-sdp';

	sdp: RTCSessionDescriptionInit;
};

// Server is requesting a webrtc offer
export type ServerMediaSignalRequestOffer = {
	callId: string;
	toContractId: string;
	type: 'request-offer';

	iceRestart?: boolean;
};

// Server is sending a notification about the call state
export type ServerMediaSignalNotification = {
	callId: string;
	type: 'notification';

	notification: CallNotification;
};

export type ServerMediaSignal =
	| ServerMediaSignalNewCall
	| ServerMediaSignalRemoteSDP
	| ServerMediaSignalRequestOffer
	| ServerMediaSignalNotification;

export type ServerMediaSignalType = ServerMediaSignal['type'];
