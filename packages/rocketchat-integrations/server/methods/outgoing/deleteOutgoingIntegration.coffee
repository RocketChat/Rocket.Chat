Meteor.methods
	deleteOutgoingIntegration: (integrationId) ->
		if not RocketChat.authz.hasPermission(@userId, 'manage-integrations') and not RocketChat.authz.hasPermission(@userId, 'manage-integrations', 'bot')
			throw new Meteor.Error 'error-action-not-allowed', 'Managing integrations is not allowed', { method: 'deleteOutgoingIntegration', action: 'Managing_integrations' }

		integration = RocketChat.models.Integrations.findOne(integrationId)

		if not integration?
			throw new Meteor.Error 'error-invalid-integration', 'Invalid integration', { method: 'deleteOutgoingIntegration' }

		RocketChat.models.Integrations.remove _id: integrationId

		return true
