import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { settings } from '../../../settings/server';
import { setRealName } from '../functions';
import { RateLimiter } from '../lib';

Meteor.methods({
	setRealName(name) {
		check(name, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setRealName' });
		}

		if (!settings.get('Accounts_AllowRealNameChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setRealName' });
		}

		if (!setRealName(Meteor.userId(), name)) {
			throw new Meteor.Error('error-could-not-change-name', 'Could not change name', {
				method: 'setRealName',
			});
		}

		return name;
	},
});

RateLimiter.limitMethod('setRealName', 1, 1000, {
	userId: () => true,
});
