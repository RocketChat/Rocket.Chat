import { Emitter } from '@rocket.chat/emitter';

import type { Client } from './Client';

export type ConnectionLifecycleEvents = {
	connected: Client;
	loggedIn: Client;
	loggedOut: Client;
	disconnected: Client;
};

/** Connection-state changes, emitted by the connection side and consumed by the service. */
export class ConnectionLifecycle extends Emitter<ConnectionLifecycleEvents> {}
