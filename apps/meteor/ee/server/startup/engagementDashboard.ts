import { Meteor } from 'meteor/meteor';

import { onToggledFeature } from '../../app/license/server/license';

onToggledFeature('engagement-dashboard', {
	up: () =>
		Meteor.startup(async () => {
			const { prepareAnalytics, prepareAuthorization, attachCallbacks } = await import('../lib/engagementDashboard/startup');
			await prepareAuthorization();
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
