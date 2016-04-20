Meteor.methods
	addOutgoingIntegration: (integration) ->
		if integration.channel?.trim? and integration.channel.trim() is ''
			delete integration.channel

		if not RocketChat.authz.hasPermission(@userId, 'manage-integrations') and not RocketChat.authz.hasPermission(@userId, 'manage-integrations', 'bot')
			throw new Meteor.Error 'error-action-not-allowed', 'Managing integrations is not allowed', { method: 'addOutgoingIntegration', action: 'Managing_integrations' }

		if integration.username.trim() is ''
			throw new Meteor.Error 'error-invalid-username', 'Invalid username', { method: 'addOutgoingIntegration' }

		if not Match.test integration.urls, [String]
			throw new Meteor.Error 'error-invalid-urls', 'Invalid URLs', { method: 'addOutgoingIntegration' }

		for url, index in integration.urls
			delete integration.urls[index] if url.trim() is ''

		integration.urls = _.without integration.urls, [undefined]

		if integration.urls.length is 0
			throw new Meteor.Error 'error-invalid-urls', 'Invalid URLs', { method: 'addOutgoingIntegration' }

		if integration.channel? and integration.channel[0] not in ['@', '#']
			throw new Meteor.Error 'error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', { method: 'addOutgoingIntegration' }

		if integration.triggerWords?
			if not Match.test integration.triggerWords, [String]
				throw new Meteor.Error 'error-invalid-triggerWords', 'Invalid triggerWords', { method: 'addOutgoingIntegration' }

			for triggerWord, index in integration.triggerWords
				delete integration.triggerWords[index] if triggerWord.trim() is ''

			integration.triggerWords = _.without integration.triggerWords, [undefined]

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
				throw new Meteor.Error 'error-invalid-room', 'Invalid room', { method: 'addOutgoingIntegration' }

		user = RocketChat.models.Users.findOne({username: integration.username})

		if not user?
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'addOutgoingIntegration' }

		integration.type = 'webhook-outgoing'
		integration.userId = user._id
		integration._createdAt = new Date
		integration._createdBy = RocketChat.models.Users.findOne @userId, {fields: {username: 1}}

		integration._id = RocketChat.models.Integrations.insert integration

		return integration
