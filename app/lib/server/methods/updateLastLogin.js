import { Meteor } from 'meteor/meteor';

import { updateLastLogin } from '../functions';

Meteor.methods({
	updateLastLogin() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'updateLastLogin' });
		}

		return updateLastLogin(Meteor.userId());
	},
});
