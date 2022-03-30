import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization/server';

Meteor.methods({
	setAdminStatus(userId, admin) {
		check(userId, String);
		check(admin, Match.Optional(Boolean));

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setAdminStatus' });
		}

		if (hasPermission(uid, 'assign-admin-role') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setAdminStatus' });
		}

		const user = Meteor.users.findOne({ _id: userId }, { fields: { username: 1 } });

		if (admin) {
			return Meteor.call('authorization:addUserToRole', 'admin', user?.username);
		}
		return Meteor.call('authorization:removeUserFromRole', 'admin', user?.username);
	},
});
