import type { IServerSettingUpdater } from '@rocket.chat/apps-engine/definition/accessors';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class ServerSettingUpdater implements IServerSettingUpdater {
	constructor(private readonly bridges: RemoteBridges) {}

	public async updateOne(setting: ISetting): Promise<void> {
		await this.bridges.getServerSettingBridge().doUpdateOne(setting, 'APP_ID');
	}

	public async incrementValue(id: ISetting['id'], value = 1): Promise<void> {
		await this.bridges.getServerSettingBridge().doIncrementValue(id, value, 'APP_ID');
	}
}
