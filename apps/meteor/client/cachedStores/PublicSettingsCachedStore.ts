import type { ISetting } from '@rocket.chat/core-typings';

import { PublicCachedStore } from '../lib/cachedStores';
import { PublicSettings } from '../stores';

class PublicSettingsCachedStore extends PublicCachedStore<ISetting> {
	constructor() {
		super({
			name: 'public-settings',
			eventType: 'notify-all',
			store: PublicSettings.use,
		});
	}
}

const instance = new PublicSettingsCachedStore();

export { instance as PublicSettingsCachedStore };
