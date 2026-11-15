import { Emitter } from '@rocket.chat/emitter';

import type { Session } from './Session';

export type ConnectionLifecycleEvents = {
	connected: Session;
	loggedIn: Session;
	loggedOut: Session;
	disconnected: Session;
	/** At most once per idle timeout while the client keeps sending. */
	activity: Session;
};

/** Connection-state changes and activity, emitted by the connection side and consumed by the service. */
export class ConnectionLifecycle extends Emitter<ConnectionLifecycleEvents> {}
