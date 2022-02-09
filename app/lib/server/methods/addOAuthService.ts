import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission } from '../../../authorization/server';
import { addOAuthService } from '../functions/addOAuthService';

Meteor.methods({
	addOAuthService(name) {
		check(name, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'addOAuthService' });
		}

		if (hasPermission(Meteor.userId(), 'add-oauth-service') !== true) {
			throw new Meteor.Error('error-action-not-allowed', 'Adding OAuth Services is not allowed', {
				method: 'addOAuthService',
				action: 'Adding_OAuth_Services',
			});
		}

		addOAuthService(name);
	},
});
