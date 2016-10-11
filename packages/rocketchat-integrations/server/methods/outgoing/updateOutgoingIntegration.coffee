Meteor.methods
	updateOutgoingIntegration: (integrationId, integration) ->
		integration = RocketChat.integrations.validateOutgoing(integration, @userId)

		if not integration.token? or integration.token?.trim() is ''
			throw new Meteor.Error 'error-invalid-token', 'Invalid token', { method: 'updateOutgoingIntegration' }

		currentIntegration = null

		if RocketChat.authz.hasPermission @userId, 'manage-integrations'
			currentIntegration = RocketChat.models.Integrations.findOne(integrationId)
		else if RocketChat.authz.hasPermission @userId, 'manage-own-integrations'
			currentIntegration = RocketChat.models.Integrations.findOne({"_id": integrationId, "_createdBy._id": @userId})
		else
			throw new Meteor.Error 'not_authorized'

		if not currentIntegration?
			throw new Meteor.Error 'invalid_integration', '[methods] updateOutgoingIntegration -> integration not found'


		RocketChat.models.Integrations.update integrationId,
			$set:
				enabled: integration.enabled
				name: integration.name
				avatar: integration.avatar
				emoji: integration.emoji
				alias: integration.alias
				channel: integration.channel
				impersonateUser: integration.impersonateUser
				username: integration.username
				userId: integration.userId
				urls: integration.urls
				token: integration.token
				script: integration.script
				scriptEnabled: integration.scriptEnabled
				scriptCompiled: integration.scriptCompiled
				scriptError: integration.scriptError
				triggerWords: integration.triggerWords
				_updatedAt: new Date
				_updatedBy: RocketChat.models.Users.findOne @userId, {fields: {username: 1}}

		return RocketChat.models.Integrations.findOne(integrationId)
