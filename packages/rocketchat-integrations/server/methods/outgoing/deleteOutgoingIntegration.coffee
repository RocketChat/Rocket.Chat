Meteor.methods
	deleteOutgoingIntegration: (integrationId) ->
		integration = null

		if RocketChat.authz.hasPermission(@userId, 'manage-integrations') or RocketChat.authz.hasPermission(@userId, 'manage-integrations', 'bot')
			integration = RocketChat.models.Integrations.findOne(integrationId)
		else if RocketChat.authz.hasPermission(@userId, 'manage-own-integrations') or RocketChat.authz.hasPermission(@userId, 'manage-own-integrations', 'bot')
			integration = RocketChat.models.Integrations.findOne(integrationId, { fields : {"_createdBy._id": @userId} })
		else
			throw new Meteor.Error 'not_authorized'

		if not integration?
			throw new Meteor.Error 'error-invalid-integration', 'Invalid integration', { method: 'deleteOutgoingIntegration' }

		RocketChat.models.Integrations.remove _id: integrationId

		return true
