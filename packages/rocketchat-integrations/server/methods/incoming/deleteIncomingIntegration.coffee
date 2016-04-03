Meteor.methods
	deleteIncomingIntegration: (integrationId) ->
		if not RocketChat.authz.hasPermission @userId, 'manage-integrations'
			throw new Meteor.Error 'not_authorized'

		integration = RocketChat.models.Integrations.findOne(integrationId)

		if not integration?
			throw new Meteor.Error 'invalid_integration', '[methods] deleteIncomingIntegration -> integration not found'

		RocketChat.models.Integrations.remove _id: integrationId

		return true
