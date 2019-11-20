import { Meteor } from 'meteor/meteor';

import { Users, Subscriptions } from '../../../models';

Meteor.methods({
	'e2e.resetOwnE2EKey'() {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'resetOwnE2EKey',
			});
		}

		Users.resetE2EKey(userId);
		Subscriptions.resetUserE2EKey(userId);

		// Force the user to logout, so that the keys can be generated again
		Users.removeResumeService(userId);
		return true;
	},
});
