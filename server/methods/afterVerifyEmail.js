import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { Users, Roles } from '../../app/models';

Meteor.methods({
	afterVerifyEmail() {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'afterVerifyEmail',
			});
		}

		const user = Users.findOneById(userId);

		const verifiedEmail = _.find(user.emails, (email) => email.verified);

		if (verifiedEmail) {
			Roles.addUserRoles(user._id, 'user');
			Roles.removeUserRoles(user._id, 'anonymous');
		}
	},
});
