import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { Users } from '../../../models';

Meteor.methods({
	getLoginToken(username) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getLoginToken' });
		}

		const user = Users.findOneByUsername(username, {});
		if (user.u) {
			if (user.u._id !== Meteor.userId()) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getLoginToken' });
			}
		}

		if (Meteor.user().u) {
			if (user._id !== Meteor.user().u._id) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getLoginToken' });
			}
		}

		const stampedToken = Accounts._generateStampedLoginToken();
		Accounts._insertLoginToken(user._id, stampedToken);
		return stampedToken;
	},
});
