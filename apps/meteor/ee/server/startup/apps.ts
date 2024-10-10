import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { Apps } from '../apps';
import { makeDisableAppsWithAddonsCallback } from '../lib/apps/makeDisableAppsWithAddonsCallback';

Meteor.startup(() => {
	async function disableAppsCallback() {
		void Apps.disableApps();
	}

	License.onInvalidateLicense(disableAppsCallback);
	License.onRemoveLicense(disableAppsCallback);
	// Disable apps that depend on add-ons (external modules) if they are invalidated
	License.onModule(makeDisableAppsWithAddonsCallback({ Apps }));
});
