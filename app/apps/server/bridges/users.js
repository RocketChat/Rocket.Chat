import { Users } from '../../../models/server';
import { getConfig } from '../../../federation/server/config';

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
		const { peer: { domain: localDomain } } = getConfig();
		const query = { active: true };

		if (localDomain) {
			query.$or = [
				{ 'federation.peer': localDomain },
				{ federation: { $exists: false } },
			];
		}

		return Users.find(query).count();
	}
}
