import type { IServerSettingsModify } from '@rocket.chat/apps-engine/definition/accessors/index.js';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings/index.js';

import { bridgeCall } from '../../bridges/bridgeCall.js';
import type * as Messenger from '../../messenger.js';

export class ServerSettingsModify implements IServerSettingsModify {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public async hideGroup(name: string): Promise<void> {
		await bridgeCall(this.senderFn, 'getServerSettingBridge', 'doHideGroup', name, 'APP_ID');
	}

	public async hideSetting(id: string): Promise<void> {
		await bridgeCall(this.senderFn, 'getServerSettingBridge', 'doHideSetting', id, 'APP_ID');
	}

	public async modifySetting(setting: ISetting): Promise<void> {
		await bridgeCall(this.senderFn, 'getServerSettingBridge', 'doUpdateOne', setting, 'APP_ID');
	}

	public async incrementValue(id: ISetting['id'], value = 1): Promise<void> {
		await bridgeCall(this.senderFn, 'getServerSettingBridge', 'doIncrementValue', id, value, 'APP_ID');
	}
}
