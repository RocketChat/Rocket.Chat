import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { hasPermission } from '../../../authorization';

Meteor.methods({
	createToken(userId) {
		if (Meteor.userId() !== userId && !hasPermission(Meteor.userId(), 'user-generate-access-token')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'createToken' });
		}
		const token = Accounts._generateStampedLoginToken();
		Accounts._insertLoginToken(userId, token);
		return {
			userId,
			authToken: token.token,
		};
	},
});
