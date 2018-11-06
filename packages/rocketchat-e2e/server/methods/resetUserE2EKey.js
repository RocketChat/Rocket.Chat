import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	'e2e.resetUserE2EKey'(userId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'resetUserE2EKey',
			});
		}

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'reset-other-user-e2e-key') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'resetUserE2EKey',
			});
		}

		RocketChat.models.Users.resetE2EKey(userId);
		RocketChat.models.Subscriptions.resetUserE2EKey(userId);

		// Force the user to logout, so that the keys can be generated again
		RocketChat.models.Users.removeResumeService(userId);
		return true;
	},
});
