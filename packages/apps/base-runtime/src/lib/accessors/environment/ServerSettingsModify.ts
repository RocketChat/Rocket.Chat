import type { IServerSettingsModify } from '@rocket.chat/apps-engine/definition/accessors';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

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
