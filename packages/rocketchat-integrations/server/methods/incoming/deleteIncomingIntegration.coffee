Meteor.methods
	deleteIncomingIntegration: (integrationId) ->
		integration = null

		if RocketChat.authz.hasPermission @userId, 'manage-integrations'
			integration = RocketChat.models.Integrations.findOne(integrationId)
		else if RocketChat.authz.hasPermission @userId, 'manage-own-integrations'
			integration = RocketChat.models.Integrations.findOne(integrationId, { fields : {"_createdBy._id": @userId} })
		else
			throw new Meteor.Error 'not_authorized'

		if not integration?
			throw new Meteor.Error 'error-invalid-integration', 'Invalid integration', { method: 'deleteIncomingIntegration' }

		RocketChat.models.Integrations.remove _id: integrationId

		return true
