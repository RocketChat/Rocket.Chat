import type { ClientState } from '../client';
import type { CallState } from './IClientMediaCall';

export type CallEvents = {
	/* Triggered when the call's server state is changed on this client, with the old state as param */
	stateChange: CallState;
	/* Triggered when the call's client state is changed (based on user interaction or internal service state) */
	clientStateChange: ClientState;
	/* Triggered when an audio track is changed, muted or put on hold */
	trackStateChange: void;
	/* Triggered when the contact information for the remote user is updated */
	contactUpdate: void;

	/* Triggered as soon as the call is registered on this client */
	initialized: void;

	/* Triggered when the call is confirmed to exist in the server */
	confirmed: void;

	/* Triggered when this client is telling the server that we want to accept the call */
	accepting: void;
	/* Triggered when the call's state on the server changes to 'accepted' */
	accepted: void;
	/* Triggered when we detect a stable webrtc connection on our side or the other side reports one to the server */
	active: void;
	/* Triggered when this client puts the call on the ignore list, either because the call was accepted on a different client or because you called `call.ignore()` */
	hidden: void;

	/* Triggered when the call's state on the server changes to 'hangup' */
	ended: void;
};
