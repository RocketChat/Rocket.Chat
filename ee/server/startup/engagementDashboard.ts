import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../app/callbacks/server';
import { onToggledFeature } from '../../app/license/server/license';

onToggledFeature('engagement-dashboard', {
	up: () => Meteor.startup(async () => {
		const {
			handleMessagesSent,
			handleMessagesDeleted,
		} = await import('../lib/engagementDashboard/messages');
		const {
			handleUserCreated,
		} = await import('../lib/engagementDashboard/users');

		callbacks.add('afterSaveMessage', handleMessagesSent, callbacks.priority.MEDIUM, 'engagementDashboard.afterSaveMessage');
		callbacks.add('afterDeleteMessage', handleMessagesDeleted, callbacks.priority.MEDIUM, 'engagementDashboard.afterDeleteMessage');
		callbacks.add('afterCreateUser', handleUserCreated, callbacks.priority.MEDIUM, 'engagementDashboard.afterCreateUser');

		await import('../api/engagementDashboard');

		const { fillFirstDaysOfMessagesIfNeeded } = await import('../lib/engagementDashboard/messages');
		const { fillFirstDaysOfUsersIfNeeded } = await import('../lib/engagementDashboard/users');

		const now = new Date();
		fillFirstDaysOfUsersIfNeeded(now);
		fillFirstDaysOfMessagesIfNeeded(now);
	}),
	down: () => Meteor.startup(() => {
		callbacks.remove('afterSaveMessage', 'engagementDashboard.afterSaveMessage');
		callbacks.remove('afterDeleteMessage', 'engagementDashboard.afterDeleteMessage');
		callbacks.remove('afterCreateUser', 'engagementDashboard.afterCreateUser');
	}),
});
