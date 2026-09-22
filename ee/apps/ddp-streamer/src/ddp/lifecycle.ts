import { Emitter } from '@rocket.chat/emitter';

import type { Client } from './Client';

export type ConnectionLifecycleEvents = {
	connected: Client;
	loggedIn: Client;
	loggedOut: Client;
	disconnected: Client;
	/** At most once per idle timeout while the client keeps sending. */
	activity: Client;
};

/** Connection-state changes and activity, emitted by the connection side and consumed by the service. */
export class ConnectionLifecycle extends Emitter<ConnectionLifecycleEvents> {}
