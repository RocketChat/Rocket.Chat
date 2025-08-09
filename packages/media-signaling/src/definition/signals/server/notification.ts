import type { CallNotification } from '../../call';

// Server is sending a notification about the call state
export type ServerMediaSignalNotification = {
	callId: string;
	type: 'notification';

	notification: CallNotification;
	// Used to inform which contract was signed by the server, without targeting the signal to that contract alone
	// Optional in general, but at least one notification must be sent with it before the callee can join the call
	signedContractId?: string;
};
