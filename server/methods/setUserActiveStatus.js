import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Users } from '../../app/models/server';
import { hasPermission } from '../../app/authorization';
import { setUserActiveStatus } from '../../app/lib/server/functions/setUserActiveStatus';

const getAdminCount = () => {
	Meteor.users.find({
		roles: {
			$in: ['admin'],
		},
		active: true,
	}).count();
};

Meteor.methods({
	setUserActiveStatus(userId, active, confirmRelenquish) {
		check(userId, String);
		check(active, Boolean);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setUserActiveStatus',
			});
		}

		if (hasPermission(Meteor.userId(), 'edit-other-user-active-status') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setUserActiveStatus',
			});
		}

		const userAdmin = Users.findOneAdmin(userId.count);

		if (userAdmin) {
			const adminCount = getAdminCount();

			if (adminCount === 1) {
				throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without an active admin is not allowed', {
					method: 'removeUserFromRole',
					action: 'Remove_last_admin',
				});
			}
		}

		setUserActiveStatus(userId, active, confirmRelenquish);
		return true;
	},
});