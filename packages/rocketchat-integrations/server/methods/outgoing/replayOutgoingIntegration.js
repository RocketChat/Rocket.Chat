Meteor.methods({
	replayOutgoingIntegration({ integrationId, historyId }) {
		let integration;

		if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-integrations', 'bot')) {
			integration = RocketChat.models.Integrations.findOne(integrationId);
		} else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations', 'bot')) {
			integration = RocketChat.models.Integrations.findOne(integrationId, { fields: { '_createdBy._id': this.userId }});
		} else {
			throw new Meteor.Error('not_authorized', 'Unauthorized', { method: 'replayOutgoingIntegration' });
		}

		if (!integration) {
			throw new Meteor.Error('error-invalid-integration', 'Invalid integration', { method: 'replayOutgoingIntegration' });
		}

		const history = RocketChat.models.IntegrationHistory.findOneByIntegrationIdAndHistoryId(integration._id, historyId);

		if (!history) {
			throw new Meteor.Error('error-invalid-integration-history', 'Invalid Integration History', { method: 'replayOutgoingIntegration' });
		}

		RocketChat.integrations.triggerHandler.replay(integration, history);

		return true;
	}
});
