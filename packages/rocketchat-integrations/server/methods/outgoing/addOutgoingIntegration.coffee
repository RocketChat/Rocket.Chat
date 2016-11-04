Meteor.methods
	addOutgoingIntegration: (integration) ->

		if (not RocketChat.authz.hasPermission @userId, 'manage-integrations') and
		not (RocketChat.authz.hasPermission @userId, 'manage-own-integrations') and
		not (RocketChat.authz.hasPermission @userId, 'manage-integrations', 'bot') and
		not (RocketChat.authz.hasPermission @userId, 'manage-own-integrations', 'bot')
			throw new Meteor.Error 'not_authorized'

		integration = RocketChat.integrations.validateOutgoing(integration, @userId)

		integration._createdAt = new Date
		integration._createdBy = RocketChat.models.Users.findOne @userId, {fields: {username: 1}}

		integration._id = RocketChat.models.Integrations.insert integration

		return integration
