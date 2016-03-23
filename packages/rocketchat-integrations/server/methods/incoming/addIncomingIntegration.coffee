Meteor.methods
	addIncomingIntegration: (integration) ->
		if not RocketChat.authz.hasPermission @userId, 'manage-integrations'
			throw new Meteor.Error 'not_authorized'

		if not _.isString(integration.channel)
			throw new Meteor.Error 'invalid_channel', '[methods] addIncomingIntegration -> channel must be string'

		if integration.channel.trim() is ''
			throw new Meteor.Error 'invalid_channel', '[methods] addIncomingIntegration -> channel can\'t be empty'

		if integration.channel[0] not in ['@', '#']
			throw new Meteor.Error 'invalid_channel', '[methods] addIncomingIntegration -> channel should start with # or @'

		if not _.isString(integration.username)
			throw new Meteor.Error 'invalid_username', '[methods] addIncomingIntegration -> username must be string'

		if integration.username.trim() is ''
			throw new Meteor.Error 'invalid_username', '[methods] addIncomingIntegration -> username can\'t be empty'

		if integration.scriptEnabled is true and integration.script? and integration.script.trim() isnt ''
			try
				babelOptions = Babel.getDefaultOptions()
				babelOptions.externalHelpers = false

				integration.scriptCompiled = Babel.compile(integration.script, babelOptions).code
				integration.scriptError = undefined
			catch e
				integration.scriptCompiled = undefined
				integration.scriptError = _.pick e, 'name', 'message', 'pos', 'loc', 'codeFrame'

		record = undefined
		channelType = integration.channel[0]
		channel = integration.channel.substr(1)

		switch channelType
			when '#'
				record = RocketChat.models.Rooms.findOne
					$or: [
						{_id: channel}
						{name: channel}
					]
			when '@'
				record = RocketChat.models.Users.findOne
					$or: [
						{_id: channel}
						{username: channel}
					]

		if record is undefined
			throw new Meteor.Error 'channel_does_not_exists', "[methods] addIncomingIntegration -> The channel does not exists"

		user = RocketChat.models.Users.findOne({username: integration.username})

		if not user?
			throw new Meteor.Error 'user_does_not_exists', "[methods] addIncomingIntegration -> The username does not exists"

		token = Random.id(48)

		integration.type = 'webhook-incoming'
		integration.token = token
		integration.userId = user._id
		integration._createdAt = new Date
		integration._createdBy = RocketChat.models.Users.findOne @userId, {fields: {username: 1}}

		RocketChat.models.Roles.addUserRoles user._id, 'bot'

		integration._id = RocketChat.models.Integrations.insert integration

		return integration
