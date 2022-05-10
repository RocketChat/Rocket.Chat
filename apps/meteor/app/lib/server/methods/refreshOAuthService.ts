import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { hasPermission } from '../../../authorization/server';
import { Settings } from '../../../models/server/raw';

Meteor.methods({
	async refreshOAuthService() {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'refreshOAuthService',
			});
		}

		if (hasPermission(userId, 'add-oauth-service') !== true) {
			throw new Meteor.Error('error-action-not-allowed', 'Refresh OAuth Services is not allowed', {
				method: 'refreshOAuthService',
				action: 'Refreshing_OAuth_Services',
			});
		}

		ServiceConfiguration.configurations.remove({});

		await Settings.update({ _id: /^(Accounts_OAuth_|SAML_|CAS_|Blockstack_).+/ }, { $set: { _updatedAt: new Date() } }, { multi: true });
	},
});
