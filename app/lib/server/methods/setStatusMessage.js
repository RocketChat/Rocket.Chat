import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { settings } from '../../../settings';
import { setStatusMessage } from '../functions';
import { RateLimiter } from '../lib';

Meteor.methods({
	setStatusMessage(statusMessage) {

		check(statusMessage, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setStatusMessage',
			});
		}

		if (!settings.get('Accounts_AllowUserStatusMessageChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setStatusMessage',
			});
		}

		if (!setStatusMessage(Meteor.userId(), statusMessage)) {
			throw new Meteor.Error('error-could-not-change-status-message', 'Could not change status message', {
				method: 'setStatusMessage',
			});
		}

		return statusMessage;
	},
});

RateLimiter.limitMethod('setStatusMessage', 1, 1000, {
	userId: () => true,
});
