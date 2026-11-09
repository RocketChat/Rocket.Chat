import type { IServerSettingUpdater } from '@rocket.chat/apps-engine/definition/accessors/index.js';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings/index.js';

import { bridgeCall } from '../../bridges/bridgeCall.js';
import type * as Messenger from '../../messenger.js';

export class ServerSettingUpdater implements IServerSettingUpdater {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public async updateOne(setting: ISetting): Promise<void> {
		await bridgeCall(this.senderFn, 'getServerSettingBridge', 'doUpdateOne', setting, 'APP_ID');
	}

	public async incrementValue(id: ISetting['id'], value = 1): Promise<void> {
		await bridgeCall(this.senderFn, 'getServerSettingBridge', 'doIncrementValue', id, value, 'APP_ID');
	}
}
