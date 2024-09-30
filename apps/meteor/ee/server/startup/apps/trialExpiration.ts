import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
	async function invalidLicenseAppsCallback() {
		const { Apps } = await import('../../apps');
		void Apps.disableApps();
	}

	License.onInvalidateLicense(invalidLicenseAppsCallback);
	License.onRemoveLicense(invalidLicenseAppsCallback);
});
