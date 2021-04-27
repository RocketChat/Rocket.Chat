import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission } from '../../app/authorization';
import { setUserActiveStatus } from '../../app/lib/server/functions/setUserActiveStatus';

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

		const user = Meteor.users.findOne({
			_id: userId,
		}, {
			fields: {
				_id: 1,
				roles: 1,
				active: 1,
			},
		});

		// Check if user is the last ACTIVE admin and Prevent removing last user from admin role
		const userIsAdmin = user.roles.indexOf('admin') > -1;
		if (userIsAdmin) {
			const adminCount = Meteor.users.find({
				roles: {
					$in: ['admin'],
				},
				active: true,
			}).count();
			if (adminCount === 1 && userIsAdmin && user.active) {
				throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without an active admin is not allowed', {
					method: 'removeUserFromRole',
					action: 'Remove_last_admin',
				});
			}
			setUserActiveStatus(userId, active, confirmRelenquish);
			return true;
		}
		setUserActiveStatus(userId, active, confirmRelenquish);
		return true;
	},
});
