import type { ISetting } from '@rocket.chat/core-typings';

import { CachedCollection } from '../cachedCollections';

class PublicSettingsCachedCollection extends CachedCollection<ISetting> {
	constructor() {
		super({
			name: 'public-settings',
			eventType: 'notify-all',
			userRelated: false,
		});
	}
}

const instance = new PublicSettingsCachedCollection();

export {
	/** @deprecated */
	instance as PublicSettingsCachedCollection,
};
