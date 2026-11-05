import { ClientSafeError } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { check } from 'meteor/check';
import type { Meteor } from 'meteor/meteor';

import { RateLimiterClass as RateLimiter } from '../../lib/RateLimiter';
import { setEmail } from '../../lib/users/setEmail';
import { settings } from '../../settings';

export const setEmailFunction = async (email: string, user: Meteor.User | IUser) => {
	check(email, String);

	if (!settings.get('Accounts_AllowEmailChange')) {
		throw new ClientSafeError('error-action-not-allowed', 'Changing email is not allowed', {
			method: 'setEmail',
			action: 'Changing_email',
		});
	}

	if (user.emails?.[0]?.address === email) {
		return email;
	}

	if (!(await setEmail(user._id, email))) {
		throw new ClientSafeError('error-could-not-change-email', 'Could not change email', {
			method: 'setEmail',
		});
	}

	return email;
};

RateLimiter.limitMethod('setEmail', 1, 1000, {
	userId(/* userId*/) {
		return true;
	},
});
