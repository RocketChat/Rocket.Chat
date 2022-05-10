import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { hasPermission } from '../../../authorization/server';

Meteor.methods({
	createToken(userId) {
		const uid = Meteor.userId();

		if (
			!['yes', 'true'].includes(String(process.env.CREATE_TOKENS_FOR_USERS)) ||
			!uid ||
			(uid !== userId && !hasPermission(uid, 'user-generate-access-token'))
		) {
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
