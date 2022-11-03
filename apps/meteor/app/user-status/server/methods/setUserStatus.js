import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { settings } from '../../../settings/server';
import { RateLimiter, setStatusText } from '../../../lib/server';

export const setUserStatusMethod = (statusType, statusText) => {
	const userId = Meteor.userId();
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setUserStatus' });
	}

	if (statusType) {
		if (statusType === 'offline' && !settings.get('Accounts_AllowInvisibleStatusOption')) {
			throw new Meteor.Error('error-status-not-allowed', 'Invisible status is disabled', {
				method: 'setUserStatus',
			});
		}
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
};

Meteor.methods({
	setUserStatus: setUserStatusMethod,
});

RateLimiter.limitMethod('setUserStatus', 1, 1000, {
	userId: () => true,
});
