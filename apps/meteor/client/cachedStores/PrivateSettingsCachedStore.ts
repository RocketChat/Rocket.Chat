import type { ISetting } from '@rocket.chat/core-typings';

import { sdk } from '../../app/utils/client/lib/SDKClient';
import { PrivateCachedStore } from '../lib/cachedStores';
import { PrivateSettings } from '../stores';

class PrivateSettingsCachedStore extends PrivateCachedStore<ISetting> {
	constructor() {
		super({
			name: 'private-settings',
			eventType: 'notify-logged',
			store: PrivateSettings.use,
		});
	}

	override setupListener() {
		return sdk.stream('notify-logged', ['private-settings-changed'], async (t, setting) => {
			this.log('record received', t, setting);
			const { _id, ...fields } = setting;
			this.store.getState().update(
				(record) => record._id === _id,
				(record) => ({ ...record, ...fields }),
			);
			this.sync();
		});
	}
}

const instance = new PrivateSettingsCachedStore();

export { instance as PrivateSettingsCachedStore };
