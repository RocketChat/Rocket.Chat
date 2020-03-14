import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { saveUser } from '../functions';
import { methodsWithTwoFactor } from '../../../2fa/server/twoFactorRequired';

methodsWithTwoFactor({
	insertOrUpdateUser(userData) {
		check(userData, Object);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'insertOrUpdateUser' });
		}

		return saveUser(Meteor.userId(), userData);
	},
});
