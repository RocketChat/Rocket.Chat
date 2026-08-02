import type { ISettingRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

// App settings are host-persisted metadata (ProxiedApp storage item), fronted by the internal
// AppResourceBridge. The value fallback that used to run host-side now runs locally.
export class SettingRead implements ISettingRead {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public getById(id: string): Promise<ISetting> {
		return bridgeCall<ISetting>(this.senderFn, 'getAppResourceBridge', 'doGetSettingById', id, 'APP_ID');
	}

	public async getValueById(id: string): Promise<any> {
		const set = (await this.getById(id)) as ISetting;

		// The host accessor checks `typeof set === 'undefined'`; across the RPC boundary an absent
		// host return arrives as null, so both are treated as "does not exist".
		if (set === undefined || set === null) {
			throw new Error(`Setting "${id}" does not exist.`);
		}

		if (set.value === undefined || set.value === null) {
			return set.packageValue;
		}

		return set.value;
	}
}
