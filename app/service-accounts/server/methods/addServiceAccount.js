import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import _ from 'underscore';

import { saveUser, checkUsernameAvailability } from '../../../lib/server/functions';
import { Users } from '../../../models';
import { settings } from '../../../settings';
import { hasPermission } from '../../../authorization/server';

Meteor.methods({
	addServiceAccount(userData) {
		check(userData, Object);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'addServiceAccount' });
		}

		if (!hasPermission(Meteor.userId(), 'create-service-account')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'addServiceAccount' });
		}

		let nameValidation;
		try {
			nameValidation = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
		} catch (error) {
			nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
		}

		if (!nameValidation.test(userData.username)) {
			throw new Meteor.Error('username-invalid', `${ _.escape(userData.username) } is not a valid username, use only letters, numbers, dots, hyphens and underscores`);
		}

		if (!checkUsernameAvailability(userData.username)) {
			throw new Meteor.Error('error-field-unavailable', `<strong>${ _.escape(userData.username) }</strong> is already in use :(`, { method: 'addServiceAccount' });
		}

		const user = Meteor.user();
		const serviceAccounts = Users.findLinkedServiceAccounts(user._id, {});
		const limit = settings.get('Service_account_limit');

		if (serviceAccounts.count() >= limit) {
			throw new Meteor.Error('error-not-allowed', 'Max service account limit reached', { method: 'addServiceAccount' });
		}

		userData.u = {
			_id: user._id,
			username: user.username,
		};
		userData.joinDefaultChannels = false;
		userData.roles = ['user'];

		userData.active = !settings.get('Service_accounts_approval_required');
		return saveUser(Meteor.userId(), userData);
	},
});
