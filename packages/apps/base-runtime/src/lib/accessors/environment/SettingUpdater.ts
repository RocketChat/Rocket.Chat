import type { ISettingUpdater } from '@rocket.chat/apps-engine/definition/accessors/ISettingUpdater';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

// The "not found" guard and the AppSettingsManager persistence run host-side in the
// AppResourceBridge (they depend on the ProxiedApp storage item and the settings manager); the
// runtime accessor is a thin forwarder.
export class SettingUpdater implements ISettingUpdater {
	constructor(private readonly bridges: RemoteBridges) {}

	public async updateValue(id: ISetting['id'], value: ISetting['value']): Promise<void> {
		await this.bridges.getAppResourceBridge().doUpdateSettingValue(id, value, 'APP_ID');
	}

	public async updateSelectOptions(id: ISetting['id'], values: ISetting['values']): Promise<void> {
		await this.bridges.getAppResourceBridge().doUpdateSettingSelectOptions(id, values, 'APP_ID');
	}
}
