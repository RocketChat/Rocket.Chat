Meteor.methods({
	deleteIncomingIntegration(integrationId) {
		let integration;

		if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
			integration = RocketChat.models.Integrations.findOne(integrationId);
		} else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
			integration = RocketChat.models.Integrations.findOne(integrationId, { fields : { '_createdBy._id': this.userId }});
		} else {
			throw new Meteor.Error('not_authorized', 'Unauthorized', { method: 'deleteIncomingIntegration' });
		}

		if (!integration) {
			throw new Meteor.Error('error-invalid-integration', 'Invalid integration', { method: 'deleteIncomingIntegration' });
		}

		RocketChat.models.Integrations.remove({ _id: integrationId });

		return true;
	}
});
