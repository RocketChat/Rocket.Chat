import type { CallContact, CallFeature } from '../../call';

/** Control state reported by the call backend (used by services where media/control lives outside the client, e.g. `cti`). */
export type MediaCallReportedState = {
	muted?: boolean;
	held?: boolean;
	remoteMuted?: boolean;
	remoteHeld?: boolean;
};

/** Sent by the server to notify an agent that something on the call was updated */
export type ServerMediaSignalUpdateCall = {
	callId: string;
	type: 'update';

	contact?: CallContact;
	features?: CallFeature[];
	state?: MediaCallReportedState;
};
