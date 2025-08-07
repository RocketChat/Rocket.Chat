import type { ClientState } from '../client';
import type { CallState } from './IClientMediaCall';

export type CallEvents = {
	// triggered when the state of a call changes (only for states known by the server); receives the old state as a param
	stateChange: CallState;

	// the client state is more detailed than the general call state, it includes sub-states that might not be relevant to the user or the UI
	clientStateChange: ClientState;

	// contactUpdate may be triggered even if nothing actually changed
	contactUpdate: void;

	initialized: void;

	accepting: void;
	accepted: void;

	ended: void;
};
