Meteor.methods
	deleteIncomingIntegration: (integrationId) ->
		if not RocketChat.authz.hasPermission @userId, 'manage-integrations'
			throw new Meteor.Error 'error-action-not-allowed', 'Managing integrations is not allowed', { method: 'deleteIncomingIntegration', action: 'Managing_integrations' }

		integration = RocketChat.models.Integrations.findOne(integrationId)

		if not integration?
			throw new Meteor.Error 'error-invalid-integration', 'Invalid integration', { method: 'deleteIncomingIntegration' }

		RocketChat.models.Integrations.remove _id: integrationId

		return true
