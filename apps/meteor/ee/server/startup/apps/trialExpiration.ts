import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
	License.onInvalidateLicense(async () => {
		const { Apps } = await import('../../apps');
		Apps.getRocketChatLogger().info('Disabling all apps due to license being invalidated');
		void Apps.disableApps();
	});
});
