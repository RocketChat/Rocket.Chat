import type { ISetting } from '@rocket.chat/core-typings';

import { sdk } from '../../app/utils/client/lib/SDKClient';
import { createDocumentMapStore, PrivateCachedStore } from '../lib/cachedStores';

class PrivateSettingsCachedStore extends PrivateCachedStore<ISetting> {
	constructor() {
		super({
			name: 'private-settings',
			eventType: 'notify-logged',
			store: createDocumentMapStore(),
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

export {
	/** @deprecated prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
	instance as PrivateSettingsCachedStore,
};
