import type { ISetting } from '@rocket.chat/core-typings';

import { createDocumentMapStore, PublicCachedStore } from '../lib/cachedStores';

class PublicSettingsCachedStore extends PublicCachedStore<ISetting> {
	constructor() {
		super({
			name: 'public-settings',
			eventType: 'notify-all',
			store: createDocumentMapStore(),
		});
	}
}

const instance = new PublicSettingsCachedStore();

export {
	/** @deprecated prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
	instance as PublicSettingsCachedStore,
};
