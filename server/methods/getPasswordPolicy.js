import { Meteor } from 'meteor/meteor';

import { passwordPolicy } from '../../app/lib';

Meteor.methods({
	getPasswordPolicy() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getPasswordPolicy',
			});
		}
		return passwordPolicy.getPasswordPolicy();
	},
});
