Meteor.methods
	deleteOutgoingIntegration: (integrationId) ->
		if not RocketChat.authz.hasPermission(@userId, 'manage-integrations') and not RocketChat.authz.hasPermission(@userId, 'manage-integrations', 'bot')
			throw new Meteor.Error 'not_authorized'

		integration = RocketChat.models.Integrations.findOne(integrationId)

		if not integration?
			throw new Meteor.Error 'invalid_integration', '[methods] deleteOutgoingIntegration -> integration not found'

		RocketChat.models.Integrations.remove _id: integrationId

		return true
