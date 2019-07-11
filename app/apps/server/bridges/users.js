import { Users } from '../../../models/server';
import { Federation } from '../../../federation/server';

export class AppUserBridge {
	constructor(orch) {
		this.orch = orch;
	}

	async getById(userId, appId) {
		this.orch.debugLog(`The App ${ appId } is getting the userId: "${ userId }"`);

		return this.orch.getConverters().get('users').convertById(userId);
	}

	async getByUsername(username, appId) {
		this.orch.debugLog(`The App ${ appId } is getting the username: "${ username }"`);

		return this.orch.getConverters().get('users').convertByUsername(username);
	}

	async getActiveUserCount() {
		return Users.find({
			active: true,
			$or: [
				{ 'federation.peer': Federation.localIdentifier },
				{ federation: { $exists: false } },
			],
		}).count();
	}
}
