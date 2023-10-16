import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

License.onToggledFeature('engagement-dashboard', {
	up: () =>
		Meteor.startup(async () => {
			const { prepareAnalytics, attachCallbacks } = await import('../lib/engagementDashboard/startup');
			await prepareAnalytics();
			attachCallbacks();
			await import('../api/engagementDashboard');
		}),
	down: () =>
		Meteor.startup(async () => {
			const { detachCallbacks } = await import('../lib/engagementDashboard/startup');
			detachCallbacks();
		}),
});
