import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { settings } from '../../../settings';
import { RateLimiter, setStatusText } from '../../../lib';

Meteor.methods({
	setUserStatus(statusType, statusText) {
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

			const userId = Meteor.userId();
			setStatusText(userId, statusText);
		}
	},
});

RateLimiter.limitMethod('setUserStatus', 1, 1000, {
	userId: () => true,
});
