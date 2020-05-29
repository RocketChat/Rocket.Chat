import { Users } from '../../../models/server/raw';

export class AppActivationBridge {
	constructor(orch) {
		this.orch = orch;
	}

	async appAdded(app) {
		await this.orch.getNotifier().appAdded(app.getID());
	}

	async appUpdated(app) {
		await this.orch.getNotifier().appUpdated(app.getID());
	}

	async appRemoved(app) {
		await this.orch.getNotifier().appRemoved(app.getID());
	}

	async appStatusChanged(app, status) {
		const userStatus = ['auto_enabled', 'manually_enabled'].includes(status) ? 'online' : 'offline';

		await Users.updateStatusByAppId(app.getID(), userStatus);

		await this.orch.getNotifier().appStatusUpdated(app.getID(), status);
	}
}
