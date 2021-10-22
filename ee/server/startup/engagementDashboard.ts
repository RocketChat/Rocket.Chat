import { Meteor } from 'meteor/meteor';

import { onToggledFeature } from '../../app/license/server/license';

onToggledFeature('engagement-dashboard', {
	up: () => Meteor.startup(async () => {
		await import('../../app/engagement-dashboard/server/listeners');
		await import('../../app/engagement-dashboard/server/api');
		const { fillFirstDaysOfMessagesIfNeeded } = await import('../../app/engagement-dashboard/server/lib/messages');
		const { fillFirstDaysOfUsersIfNeeded } = await import('../../app/engagement-dashboard/server/lib/users');

		const now = new Date();
		fillFirstDaysOfUsersIfNeeded(now);
		fillFirstDaysOfMessagesIfNeeded(now);
	}),
});
