import { CachedCollection } from '../../../app/ui-cached-collection/client';

export class PublicSettingsCachedCollection extends CachedCollection {
	constructor() {
		super({
			name: 'public-settings',
			eventType: 'onAll',
			userRelated: false,
			listenChangesForLoggedUsersOnly: true,
		});
	}

	static instance: PublicSettingsCachedCollection;

	static get(): PublicSettingsCachedCollection {
		if (!PublicSettingsCachedCollection.instance) {
			PublicSettingsCachedCollection.instance = new PublicSettingsCachedCollection();
		}

		return PublicSettingsCachedCollection.instance;
	}
}
