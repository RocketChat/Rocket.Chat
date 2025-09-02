import type { ClientState } from '../client';
import type { CallState } from './IClientMediaCall';

export type CallEvents = {
	stateChange: CallState;
	clientStateChange: ClientState;
	trackStateChange: void;
	contactUpdate: void;

	initialized: void;

	accepting: void;
	accepted: void;
	active: void;
	hidden: void;

	ended: void;
};
