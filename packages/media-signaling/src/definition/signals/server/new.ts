import type { CallContact, CallRole, CallService, CallFlag } from '../../call';

/** Sent by the server to notify an agent that there's a new call for their actor */
export type ServerMediaSignalNewCall = {
	callId: string;
	type: 'new';

	service: CallService;
	kind: 'direct';
	role: CallRole;
	self: CallContact;
	contact: CallContact;

	/** This will only be sent to the caller, with the id it used to request this call */
	requestedCallId?: string;
	/** If this new call initiated from a transfer, this will hold the id of the call that was transferred */
	replacingCallId?: string;
	/** If this new call initiated from a transfer, this will hold the information of the user who requested the transfer */
	transferredBy?: CallContact;

	// A list of flags that may be sent to the client to toggle custom behaviors
	flags?: CallFlag[];
};
