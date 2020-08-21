import { Meteor } from 'meteor/meteor';

import { Users, Subscriptions } from '../../../models';
import { twoFactorRequired } from '../../../2fa/server/twoFactorRequired';
import { hasPermission } from '../../../authorization/server';
import { settings } from '../../../settings/server';

Meteor.methods({
	'e2e.resetOtherE2EKey': twoFactorRequired(function(otherUserId) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'e2e.resetOtherE2EKey',
			});
		}

		if (!settings.get('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'e2e.resetOtherE2EKey',
			});
		}

		if (hasPermission(Meteor.userId(), 'edit-other-user-e2ee') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'e2e.resetOtherE2EKey',
			});
		}

		const user = Meteor.users.findOne({ _id: otherUserId }, { fields: { _id: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user-id', 'Invalid user id', {
				method: 'e2e.resetOtherE2EKey',
			});
		}

		Users.resetE2EKey(otherUserId);
		Subscriptions.resetUserE2EKey(otherUserId);

		// Force the user to logout, so that the keys can be generated again
		Users.removeResumeService(otherUserId);
		return true;
	}),
});
