import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

Meteor.startup(async () => {
	const { Apps } = await import('../../apps');
	License.onInvalidateLicense(async () => {
		void Apps.migratePrivateApps();
	});
	License.onRemoveLicense(async () => {
		void Apps.migratePrivateApps();
	});
});
