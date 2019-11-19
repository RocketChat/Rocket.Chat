import { Subscriptions, Settings } from '../../../models';
import { settings } from '../../../settings';

export class AppInternalBridge {
	constructor(orch) {
		this.orch = orch;
	}

	getUsernamesOfRoomById(roomId) {
		const records = Subscriptions.findByRoomIdWhenUsernameExists(roomId, {
			fields: {
				'u.username': 1,
			},
		}).fetch();

		if (!records || records.length === 0) {
			return [];
		}

		return records.map((s) => s.u.username);
	}

	getWorkspacePublicKey() {
		const publicKeySetting = Settings.findById('Cloud_Workspace_PublicKey').fetch()[0];

		return this.orch.getConverters().get('settings').convertToApp(publicKeySetting);
	}

	isDevelopmentModeEnabled() {
		return settings.get('Apps_Framework_Development_Mode') === true;
	}
}
