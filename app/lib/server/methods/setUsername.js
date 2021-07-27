import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import _ from 'underscore';

import { settings } from '../../../settings';
import { Users } from '../../../models';
import { callbacks } from '../../../callbacks';
import { checkUsernameAvailability } from '../functions';
import { RateLimiter } from '../lib';
import { saveUserIdentity } from '../functions/saveUserIdentity';

Meteor.methods({
	setUsername(username, param = {}) {
		const { joinDefaultChannelsSilenced } = param;
		check(username, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setUsername' });
		}

		const user = Meteor.user();

		if (user.username && !settings.get('Accounts_AllowUsernameChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setUsername' });
		}

		if (user.username === username || (user.username && user.username.toLowerCase() === username.toLowerCase())) {
			return username;
		}

		let nameValidation;
		try {
			nameValidation = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
		} catch (error) {
			nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
		}

		if (!nameValidation.test(username)) {
			throw new Meteor.Error('username-invalid', `${ _.escape(username) } is not a valid username, use only letters, numbers, dots, hyphens and underscores`);
		}

		if (!checkUsernameAvailability(username)) {
			throw new Meteor.Error('error-field-unavailable', `<strong>${ _.escape(username) }</strong> is already in use :(`, { method: 'setUsername', field: username });
		}

		if (!saveUserIdentity({ _id: user._id, username })) {
			throw new Meteor.Error('error-could-not-change-username', 'Could not change username', { method: 'setUsername' });
		}

		if (!user.username) {
			Meteor.runAsUser(user._id, () => Meteor.call('joinDefaultChannels', joinDefaultChannelsSilenced));
			Meteor.defer(function() {
				return callbacks.run('afterCreateUser', Users.findOneById(user._id));
			});
		}

		return username;
	},
});

RateLimiter.limitMethod('setUsername', 1, 1000, {
	userId() { return true; },
});
