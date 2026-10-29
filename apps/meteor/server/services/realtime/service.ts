import { MeteorService, ServiceClassInternal } from '@rocket.chat/core-services';
import type { AutoUpdateRecord } from '@rocket.chat/core-services';

import { meteorCollections } from '../../lib/realtime/ddpServer';
import { sessions } from '../../lib/realtime/sessions';

// The architecture is the DDP document id, so it is not repeated in the fields, matching Meteor's autoupdate collection.
const setClientVersion = ({ _id, ...version }: AutoUpdateRecord): void => {
	meteorCollections.clientVersions.set(_id, version);
};

/**
 * Keeps the websocket sessions of this process in step with the rest of the server: forced logouts, login service
 * changes and new client versions.
 */
export class RealtimeService extends ServiceClassInternal {
	protected name = 'realtime';

	constructor() {
		super();

		this.onEvent('user.forceLogout', (uid: string, sessionId?: string) => {
			if (sessionId) {
				sessions.closeSession(sessionId);
				return;
			}
			sessions.closeForUser(uid);
		});

		this.onEvent('watch.loginServiceConfiguration', ({ clientAction, id, data }) => {
			if (clientAction === 'removed') {
				meteorCollections.loginServices.remove(id);
				return;
			}
			if (data) {
				meteorCollections.loginServices.set(id, data);
			}
		});

		this.onEvent('meteor.clientVersionUpdated', setClientVersion);
	}

	override async started(): Promise<void> {
		const [loginServices, versions] = await Promise.all([
			MeteorService.getLoginServiceConfiguration(),
			MeteorService.getAutoUpdateClientVersions(),
		]);
		loginServices.forEach((record) => meteorCollections.loginServices.set(record._id, record));
		Object.values(versions ?? {}).forEach(setClientVersion);
	}

	override async stopped(): Promise<void> {
		sessions.terminateAll();
	}
}
