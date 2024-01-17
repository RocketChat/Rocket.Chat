import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
	License.onInvalidateLicense(async () => {
		const { Apps } = await import('../../apps');
		void Apps.disableApps();
	});
});
