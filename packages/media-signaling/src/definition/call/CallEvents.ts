import type { CallState } from './CallState';

export type CallEvents = {
	// stateChange receives the old state as param
	stateChange: CallState;
	// contactUpdate may be triggered even if nothing actually changed
	contactUpdate: void;

	accepted: void;

	ended: void;
};
