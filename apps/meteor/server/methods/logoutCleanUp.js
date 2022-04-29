import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';

import { callbacks } from '../../lib/callbacks';
import { Sessions } from '../../app/models/server/raw/index';

Meteor.methods({
	async logoutCleanUp(user, loginToken) {
		check(user, Object);
		check(loginToken, String);

		if (loginToken) {
			const token = Accounts._hashLoginToken(loginToken);
			await Sessions.updateMany({ userId: user._id, token }, { $set: { logoutAt: new Date(), logoutBy: user._id } });
		}
		Meteor.defer(function () {
			callbacks.run('afterLogoutCleanUp', user);
		});
	},
});
