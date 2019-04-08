import { Meteor } from 'meteor/meteor';
import { Users, Subscriptions } from '../../../models';
import { hasPermission } from '../../../authorization';

Meteor.methods({
	'e2e.resetUserE2EKey'(userId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'resetUserE2EKey',
			});
		}

		if (hasPermission(Meteor.userId(), 'reset-other-user-e2e-key') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'resetUserE2EKey',
			});
		}

		Users.resetE2EKey(userId);
		Subscriptions.resetUserE2EKey(userId);

		// Force the user to logout, so that the keys can be generated again
		Users.removeResumeService(userId);
		return true;
	},
});
