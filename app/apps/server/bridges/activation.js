import { STATUS_MAP } from '../../../../imports/users-presence/server/activeUsers';
import { Users } from '../../../models';
import { Notifications } from '../../../notifications/server';

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
		const { _id, username } = Users.findOne({ appId: app.getID() });

		let userStatus = 'offline';
		if (['auto_enabled', 'manually_enabled'].includes(status)) {
			userStatus = 'online';
		}
		Users.update(_id, { $set: { status: userStatus } });
		Notifications.notifyLogged('user-status', [
			_id,
			username,
			STATUS_MAP[userStatus],
		]);

		await this.orch.getNotifier().appStatusUpdated(app.getID(), status);
	}
}
