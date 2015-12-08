Meteor.methods
	deleteIntegration: (integrationId) ->
		if not RocketChat.models.Integrations.findOne(integrationId)?
			throw new Meteor.Error 'invalid_integration', '[methods] addIntegration -> integration not found'

		RocketChat.models.Integrations.remove _id: integrationId

		return true
