import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

Meteor.startup(async () => {
	const { Apps } = await import('../../apps');
	License.onInvalidateLicense(() => {
		void Apps.disableApps();
	});
	License.onRemoveLicense(() => {
		void Apps.disableApps();
	});
});
