import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { Apps } from '../../apps';

Meteor.startup(async () => {
	const updateAppsCallback = async () => {
		if (!Apps.isInitialized) return;

		void Apps.migratePrivateApps();
		void Apps.disableMarketplaceApps();
	};

	License.onInvalidateLicense(updateAppsCallback);
	License.onRemoveLicense(updateAppsCallback);
});
