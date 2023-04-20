import type { ISetting } from '@rocket.chat/core-typings';

import { CachedCollection } from '../../../app/ui-cached-collection/client';

class PublicSettingsCachedCollection extends CachedCollection<ISetting> {
	constructor() {
		super({
			name: 'public-settings',
			eventType: 'onAll',
			userRelated: false,
		});
	}
}

const instance = new PublicSettingsCachedCollection();

export {
	/** @deprecated */
	instance as PublicSettingsCachedCollection,
};
