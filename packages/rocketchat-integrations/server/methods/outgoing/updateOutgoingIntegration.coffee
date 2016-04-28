Meteor.methods
	updateOutgoingIntegration: (integrationId, integration) ->

		if integration.username.trim() is ''
			throw new Meteor.Error 'error-invalid-username', 'Invalid username', { method: 'updateOutgoingIntegration' }

		if not Match.test integration.urls, [String]
			throw new Meteor.Error 'error-invalid-urls', 'Invalid URLs', { method: 'updateOutgoingIntegration' }

		for url, index in integration.urls
			delete integration.urls[index] if url.trim() is ''

		integration.urls = _.without integration.urls, [undefined]

		if integration.urls.length is 0
			throw new Meteor.Error 'error-invalid-urls', 'Invalid URLs', { method: 'updateOutgoingIntegration' }

		if _.isString(integration.channel)
			integration.channel = integration.channel.trim()
		else
			integration.channel = undefined

		if integration.channel? and integration.channel[0] not in ['@', '#']
			throw new Meteor.Error 'error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', { method: 'updateOutgoingIntegration' }

		if not integration.token? or integration.token?.trim() is ''
			throw new Meteor.Error 'error-invalid-token', 'Invalid token', { method: 'updateOutgoingIntegration' }

		if integration.triggerWords?
			if not Match.test integration.triggerWords, [String]
				throw new Meteor.Error 'error-invalid-triggerWords', 'Invalid triggerWords', { method: 'updateOutgoingIntegration' }

			for triggerWord, index in integration.triggerWords
				delete integration.triggerWords[index] if triggerWord.trim() is ''

			integration.triggerWords = _.without integration.triggerWords, [undefined]

		currentIntegration = null

		if RocketChat.authz.hasPermission @userId, 'manage-integrations'
			currentIntegration = RocketChat.models.Integrations.findOne(integrationId)
		else if RocketChat.authz.hasPermission @userId, 'manage-own-integrations'
			currentIntegration = RocketChat.models.Integrations.findOne({"_id": integrationId, "_createdBy._id": @userId})
		else
			throw new Meteor.Error 'not_authorized'

		if not currentIntegration?
			throw new Meteor.Error 'invalid_integration', '[methods] updateOutgoingIntegration -> integration not found'

		if integration.scriptEnabled is true and integration.script? and integration.script.trim() isnt ''
			try
				babelOptions = Babel.getDefaultOptions()
				babelOptions.externalHelpers = false

				integration.scriptCompiled = Babel.compile(integration.script, babelOptions).code
				integration.scriptError = undefined
			catch e
				integration.scriptCompiled = undefined
				integration.scriptError = _.pick e, 'name', 'message', 'pos', 'loc', 'codeFrame'


		if integration.channel?
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
				throw new Meteor.Error 'error-invalid-room', 'Invalid room', { method: 'updateOutgoingIntegration' }

			if record.usernames? and
			(not RocketChat.authz.hasPermission @userId, 'manage-integrations') and
			(RocketChat.authz.hasPermission @userId, 'manage-own-integrations') and
			Meteor.user()?.username not in record.usernames
				throw new Meteor.Error 'error-invalid-channel', 'Invalid Channel', { method: 'updateOutgoingIntegration' }

		user = RocketChat.models.Users.findOne({username: integration.username})

		if not user?
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'updateOutgoingIntegration' }

		RocketChat.models.Integrations.update integrationId,
			$set:
				enabled: integration.enabled
				name: integration.name
				avatar: integration.avatar
				emoji: integration.emoji
				alias: integration.alias
				channel: integration.channel
				username: integration.username
				userId: user._id
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
