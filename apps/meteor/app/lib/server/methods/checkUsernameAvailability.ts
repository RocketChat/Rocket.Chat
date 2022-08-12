import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { settings } from '../../../settings/server';
import { checkUsernameAvailability } from '../functions';
import { RateLimiter } from '../lib';

Meteor.methods({
	checkUsernameAvailability(username) {
		check(username, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setUsername' });
		}

		const user = Meteor.user();

		if (user?.username && !settings.get('Accounts_AllowUsernameChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setUsername' });
		}

		if (user?.username === username) {
			return true;
		}
		return checkUsernameAvailability(username);
	},
});

RateLimiter.limitMethod('checkUsernameAvailability', 1, 1000, {
	userId() {
		return true;
	},
});
