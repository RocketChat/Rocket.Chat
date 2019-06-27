import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { settings } from '../../../settings';
import { RateLimiter, setStatusText } from '../../../lib';

Meteor.methods({
	setUserStatus(statusType, statusText) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setUserStatus' });
		}

		if (statusType) {
			Meteor.call('UserPresence:setDefaultStatus', statusType);
		}

		if (statusText || statusText === '') {
			check(statusText, String);

			if (!settings.get('Accounts_AllowUserStatusMessageChange')) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed', {
					method: 'setUserStatus',
				});
			}

			setStatusText(userId, statusText);
		}
	},
});

RateLimiter.limitMethod('setUserStatus', 1, 1000, {
	userId: () => true,
});
