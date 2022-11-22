import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { settings } from '../../../settings/server';
import { checkUsernameAvailability } from '../functions';
import { RateLimiter } from '../lib';
import { methodDeprecationLogger } from '../lib/deprecationWarningLogger';

Meteor.methods({
	checkUsernameAvailability(username) {
		methodDeprecationLogger.warn('checkUsernameAvailability will be deprecated in future versions of Rocket.Chat');

		check(username, String);

		const user = Meteor.user();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setUsername' });
		}

		if (user.username && !settings.get('Accounts_AllowUsernameChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setUsername' });
		}

		if (user.username === username) {
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
