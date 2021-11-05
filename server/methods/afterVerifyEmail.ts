import { Meteor } from 'meteor/meteor';

import { Users } from '../../app/models/server';
import { Roles } from '../../app/models/server/raw';

Meteor.methods({
	async afterVerifyEmail() {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'afterVerifyEmail',
			});
		}

		const user = Users.findOneById(userId);
		if (user && user.emails && Array.isArray(user.emails)) {
			const verifiedEmail = user.emails.find((email) => email.verified);
			const rolesToChangeTo = { anonymous: ['user'] };
			const rolesThatNeedChanges = user.roles.filter((role) => rolesToChangeTo[role]);

			if (rolesThatNeedChanges.length && verifiedEmail) {
				await Promise.all(rolesThatNeedChanges.map(async (role) => {
					await Roles.addUserRoles(user._id, rolesToChangeTo[role]);
					await Roles.removeUserRoles(user._id, role);
				}));
			}
		}
	},
});
