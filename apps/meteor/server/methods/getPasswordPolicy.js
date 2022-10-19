import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Users } from '../../app/models/server';
import { passwordPolicy } from '../../app/lib';
import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	getPasswordPolicy(params = {}) {
		methodDeprecationLogger.warn('getPasswordPolicy is deprecated and will be removed in future versions of Rocket.Chat');

		check(params, { token: String });

		const user = Users.findOne({ 'services.password.reset.token': params.token });
		if (!user && !Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getPasswordPolicy',
			});
		}
		return passwordPolicy.getPasswordPolicy();
	},
});
