import type { CallContact, CallRole, CallService } from '../../call';

/** Sent by the server to notify an agent that there's a new call for their actor */
export type ServerMediaSignalNewCall = {
	callId: string;
	type: 'new';

	service: CallService;
	kind: 'direct';
	role: CallRole;
	contact: CallContact;

	/** This will only be sent to the caller, with the id it used to request this call */
	requestedCallId?: string;
};
