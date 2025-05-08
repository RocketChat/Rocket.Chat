import type { ISetting } from '@rocket.chat/core-typings';

import { PublicCachedCollection } from '../cachedCollections/CachedCollection';

class PublicSettingsCachedCollection extends PublicCachedCollection<ISetting> {
	constructor() {
		super({
			name: 'public-settings',
			eventType: 'notify-all',
		});
	}
}

const instance = new PublicSettingsCachedCollection();

export {
	/** @deprecated */
	instance as PublicSettingsCachedCollection,
};
