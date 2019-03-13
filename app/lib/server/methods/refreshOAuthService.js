import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { hasPermission } from '/app/authorization';
import { Settings } from '/app/models';

Meteor.methods({
	refreshOAuthService() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'refreshOAuthService' });
		}

		if (hasPermission(Meteor.userId(), 'add-oauth-service') !== true) {
			throw new Meteor.Error('error-action-not-allowed', 'Refresh OAuth Services is not allowed', { method: 'refreshOAuthService', action: 'Refreshing_OAuth_Services' });
		}

		ServiceConfiguration.configurations.remove({});

		Settings.update({ _id: /^Accounts_OAuth_.+/ }, { $set: { _updatedAt: new Date } }, { multi: true });
	},
});
