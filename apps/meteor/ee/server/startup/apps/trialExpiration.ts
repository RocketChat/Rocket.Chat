import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { Apps } from '../../apps';

Meteor.startup(async () => {
	const migratePrivateAppsCallback = async () => {
		if (!Apps.isInitialized) return;

		void Apps.migratePrivateApps();
	};

	License.onInvalidateLicense(migratePrivateAppsCallback);
	License.onRemoveLicense(migratePrivateAppsCallback);
});
