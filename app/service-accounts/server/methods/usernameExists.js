import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { checkUsernameAvailability } from '../../../lib/server';

Meteor.methods({
	usernameExists(username) {
		check(username, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'roomExists',
			});
		}
		return !checkUsernameAvailability(username);
	},
});
