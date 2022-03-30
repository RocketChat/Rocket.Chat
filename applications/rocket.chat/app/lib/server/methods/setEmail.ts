import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { settings } from '../../../settings/server';
import { setEmail } from '../functions';
import { RateLimiter } from '../lib';

Meteor.methods({
	setEmail(email) {
		check(email, String);

		const user = Meteor.user();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setEmail' });
		}

		if (!settings.get('Accounts_AllowEmailChange')) {
			throw new Meteor.Error('error-action-not-allowed', 'Changing email is not allowed', {
				method: 'setEmail',
				action: 'Changing_email',
			});
		}

		if (user.emails && user.emails[0] && user.emails[0].address === email) {
			return email;
		}

		if (!setEmail(user._id, email)) {
			throw new Meteor.Error('error-could-not-change-email', 'Could not change email', {
				method: 'setEmail',
			});
		}

		return email;
	},
});

RateLimiter.limitMethod('setEmail', 1, 1000, {
	userId(/* userId*/) {
		return true;
	},
});
