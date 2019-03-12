import { Meteor } from 'meteor/meteor';
import { hasPermission } from '/app/authorization';
import { IntegrationHistory, Integrations } from '/app/models';

Meteor.methods({
	clearIntegrationHistory(integrationId) {
		let integration;

		if (hasPermission(this.userId, 'manage-integrations') || hasPermission(this.userId, 'manage-integrations', 'bot')) {
			integration = Integrations.findOne(integrationId);
		} else if (hasPermission(this.userId, 'manage-own-integrations') || hasPermission(this.userId, 'manage-own-integrations', 'bot')) {
			integration = Integrations.findOne(integrationId, { fields: { '_createdBy._id': this.userId } });
		} else {
			throw new Meteor.Error('not_authorized', 'Unauthorized', { method: 'clearIntegrationHistory' });
		}

		if (!integration) {
			throw new Meteor.Error('error-invalid-integration', 'Invalid integration', { method: 'clearIntegrationHistory' });
		}

		IntegrationHistory.removeByIntegrationId(integrationId);

		return true;
	},
});
