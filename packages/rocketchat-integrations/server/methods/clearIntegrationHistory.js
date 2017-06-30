Meteor.methods({
	clearIntegrationHistory(integrationId) {
		let integration;

		if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-integrations', 'bot')) {
			integration = RocketChat.models.Integrations.findOne(integrationId);
		} else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations', 'bot')) {
			integration = RocketChat.models.Integrations.findOne(integrationId, { fields: { '_createdBy._id': this.userId }});
		} else {
			throw new Meteor.Error('not_authorized', 'Unauthorized', { method: 'clearIntegrationHistory' });
		}

		if (!integration) {
			throw new Meteor.Error('error-invalid-integration', 'Invalid integration', { method: 'clearIntegrationHistory' });
		}

		RocketChat.models.IntegrationHistory.removeByIntegrationId(integrationId);

		return true;
	}
});
