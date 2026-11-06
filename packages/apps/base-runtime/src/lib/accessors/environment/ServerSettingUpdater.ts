import type { IServerSettingUpdater } from '@rocket.chat/apps-engine/definition/accessors';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class ServerSettingUpdater implements IServerSettingUpdater {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public async updateOne(setting: ISetting): Promise<void> {
		await bridgeCall(this.senderFn, 'getServerSettingBridge', 'doUpdateOne', setting, 'APP_ID');
	}

	public async incrementValue(id: ISetting['id'], value = 1): Promise<void> {
		await bridgeCall(this.senderFn, 'getServerSettingBridge', 'doIncrementValue', id, value, 'APP_ID');
	}
}
