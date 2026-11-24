import { MeteorService, ServiceClassInternal } from '@rocket.chat/core-services';
import { applyLoginServiceConfigurationChange, setClientVersion } from '@rocket.chat/ddp-server';

import { meteorCollections } from '../../lib/realtime/ddpServer';
import { sessions } from '../../lib/realtime/sessions';

/**
 * Keeps the websocket sessions of this process in step with the rest of the server: forced logouts, login service
 * changes and new client versions.
 */
export class RealtimeService extends ServiceClassInternal {
	protected name = 'realtime';

	constructor() {
		super();

		this.onEvent('user.forceLogout', (uid: string, sessionId?: string) => sessions.forceLogout(uid, sessionId));

		this.onEvent('watch.loginServiceConfiguration', (change) =>
			applyLoginServiceConfigurationChange(meteorCollections.loginServices, change),
		);

		this.onEvent('meteor.clientVersionUpdated', (record) => setClientVersion(meteorCollections.clientVersions, record));
	}

	override async started(): Promise<void> {
		const [loginServices, versions] = await Promise.all([
			MeteorService.getLoginServiceConfiguration(),
			MeteorService.getAutoUpdateClientVersions(),
		]);
		loginServices.forEach((record) => meteorCollections.loginServices.set(record._id, record));
		Object.values(versions ?? {}).forEach((record) => setClientVersion(meteorCollections.clientVersions, record));
	}

	override async stopped(): Promise<void> {
		sessions.terminateAll();
	}
}
