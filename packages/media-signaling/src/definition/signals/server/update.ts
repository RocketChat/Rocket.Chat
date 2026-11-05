import type { CallContact, CallFeature } from '../../call';

/** Sent by the server to notify an agent that something on the call was updated */
export type ServerMediaSignalUpdateCall = {
	callId: string;
	type: 'update';

	contact: CallContact;
	features?: CallFeature[];
};
