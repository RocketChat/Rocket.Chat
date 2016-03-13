Meteor.methods
	deleteIncomingIntegration: (integrationId) ->
		if not RocketChat.authz.hasPermission @userId, 'manage-integrations'
			throw new Meteor.Error 'not_authorized'

		integration = RocketChat.models.Integrations.findOne(integrationId)

		if not integration?
			throw new Meteor.Error 'invalid_integration', '[methods] deleteIncomingIntegration -> integration not found'

		updateObj =
			$pull:
				'services.resume.loginTokens':
					hashedToken: integration.token
					integration: true

		RocketChat.models.Users.update {_id: integration.userId}, updateObj

		RocketChat.models.Integrations.remove _id: integrationId

		return true
