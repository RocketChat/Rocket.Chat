import type { IServerSettingsModify } from '@rocket.chat/apps-engine/definition/accessors';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class ServerSettingsModify implements IServerSettingsModify {
	constructor(private readonly bridges: RemoteBridges) {}

	public async hideGroup(name: string): Promise<void> {
		await this.bridges.getServerSettingBridge().doHideGroup(name, 'APP_ID');
	}

	public async hideSetting(id: string): Promise<void> {
		await this.bridges.getServerSettingBridge().doHideSetting(id, 'APP_ID');
	}

	public async modifySetting(setting: ISetting): Promise<void> {
		await this.bridges.getServerSettingBridge().doUpdateOne(setting, 'APP_ID');
	}

	public async incrementValue(id: ISetting['id'], value = 1): Promise<void> {
		await this.bridges.getServerSettingBridge().doIncrementValue(id, value, 'APP_ID');
	}
}
