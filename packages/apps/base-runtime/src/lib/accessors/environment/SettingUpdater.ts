import type { ISettingUpdater } from '@rocket.chat/apps-engine/definition/accessors/ISettingUpdater.js';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings/index.js';

import { bridgeCall } from '../../bridges/bridgeCall.js';
import type * as Messenger from '../../messenger.js';

// The "not found" guard and the AppSettingsManager persistence run host-side in the
// AppResourceBridge (they depend on the ProxiedApp storage item and the settings manager); the
// runtime accessor is a thin forwarder.
export class SettingUpdater implements ISettingUpdater {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public async updateValue(id: ISetting['id'], value: ISetting['value']): Promise<void> {
		await bridgeCall(this.senderFn, 'getAppResourceBridge', 'doUpdateSettingValue', id, value, 'APP_ID');
	}

	public async updateSelectOptions(id: ISetting['id'], values: ISetting['values']): Promise<void> {
		await bridgeCall(this.senderFn, 'getAppResourceBridge', 'doUpdateSettingSelectOptions', id, values, 'APP_ID');
	}
}
