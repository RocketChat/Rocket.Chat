import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { saveUser } from '../functions';
import { twoFactorRequired } from '../../../2fa/server/twoFactorRequired';

Meteor.methods({
	insertOrUpdateUser: twoFactorRequired(function (userData) {
		check(userData, Object);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'insertOrUpdateUser',
			});
		}

		return saveUser(Meteor.userId(), userData);
	}),
});
