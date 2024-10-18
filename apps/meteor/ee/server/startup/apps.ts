import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { Apps } from '../apps';
import { disableAppsWithAddonsCallback } from '../lib/apps/disableAppsWithAddonsCallback';

Meteor.startup(() => {
	async function migratePrivateAppsCallback() {
		if (!Apps.isInitialized) return;

		void Apps.migratePrivateApps();
		void Apps.disableMarketplaceApps();
	}

	License.onInvalidateLicense(migratePrivateAppsCallback);
	License.onRemoveLicense(migratePrivateAppsCallback);

	// Disable apps that depend on add-ons (external modules) if they are invalidated
	License.onModule(disableAppsWithAddonsCallback);
});
