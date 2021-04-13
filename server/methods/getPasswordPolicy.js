import { Meteor } from 'meteor/meteor';

import { Users } from '../../app/models';
import { passwordPolicy } from '../../app/lib';

Meteor.methods({
	getPasswordPolicy(params) {
		const user = Users.findOne({ 'services.password.reset.token': params.token });
		if (!user && !Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getPasswordPolicy',
			});
		}
		return passwordPolicy.getPasswordPolicy();
	},
});
