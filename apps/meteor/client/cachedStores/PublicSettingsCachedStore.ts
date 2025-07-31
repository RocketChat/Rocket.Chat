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

export { instance as PublicSettingsCachedStore };
