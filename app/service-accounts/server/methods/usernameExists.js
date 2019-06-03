import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Users } from '../../../models';

Meteor.methods({
	usernameExists(name) {
		check(name, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'roomExists',
			});
		}
		const user = Users.findOneByUsername(name, {});
		return !!user;
	},
});
