Meteor.methods
	addIncomingIntegration: (integration) ->
		if (not RocketChat.authz.hasPermission @userId, 'manage-integrations') and (not RocketChat.authz.hasPermission @userId, 'manage-own-integrations')
			throw new Meteor.Error 'not_authorized'

		if not _.isString(integration.channel)
			throw new Meteor.Error 'error-invalid-channel', 'Invalid channel', { method: 'addIncomingIntegration' }

		if integration.channel.trim() is ''
			throw new Meteor.Error 'error-invalid-channel', 'Invalid channel', { method: 'addIncomingIntegration' }

		if integration.channel[0] not in ['@', '#']
			throw new Meteor.Error 'error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', { method: 'addIncomingIntegration' }

		if not _.isString(integration.username)
			throw new Meteor.Error 'error-invalid-username', 'Invalid username', { method: 'addIncomingIntegration' }

		if integration.username.trim() is ''
			throw new Meteor.Error 'error-invalid-username', 'Invalid username', { method: 'addIncomingIntegration' }

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
			throw new Meteor.Error 'error-invalid-room', 'Invalid room', { method: 'addIncomingIntegration' }

		if record.usernames? and
		(not RocketChat.authz.hasPermission @userId, 'manage-integrations') and
		(RocketChat.authz.hasPermission @userId, 'manage-own-integrations') and
		Meteor.user()?.username not in record.usernames
			throw new Meteor.Error 'error-invalid-channel', 'Invalid Channel', { method: 'addIncomingIntegration' }

		user = RocketChat.models.Users.findOne({username: integration.username})

		if not user?
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'addIncomingIntegration' }

		token = Random.id(48)

		integration.type = 'webhook-incoming'
		integration.token = token
		integration.userId = user._id
		integration._createdAt = new Date
		integration._createdBy = RocketChat.models.Users.findOne @userId, {fields: {username: 1}}

		RocketChat.models.Roles.addUserRoles user._id, 'bot'

		integration._id = RocketChat.models.Integrations.insert integration

		return integration
