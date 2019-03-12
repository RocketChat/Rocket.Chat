import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { hasPermission } from 'meteor/rocketchat:authorization';

Meteor.methods({
	setAdminStatus(userId, admin) {

		check(userId, String);
		check(admin, Match.Optional(Boolean));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setAdminStatus' });
		}

		if (hasPermission(Meteor.userId(), 'assign-admin-role') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setAdminStatus' });
		}

		const user = Meteor.users.findOne({ _id: userId }, { fields: { username: 1 } });

		if (admin) {
			return Meteor.call('authorization:addUserToRole', 'admin', user.username);
		} else {
			return Meteor.call('authorization:removeUserFromRole', 'admin', user.username);
		}
	},
});
