Meteor.methods
	addOutgoingIntegration: (integration) ->
		if integration.channel?.trim? and integration.channel.trim() is ''
			delete integration.channel

		if not RocketChat.authz.hasPermission(@userId, 'manage-integrations') and not RocketChat.authz.hasPermission(@userId, 'manage-integrations', 'bot')
			throw new Meteor.Error 'not_authorized'

		if integration.username.trim() is ''
			throw new Meteor.Error 'invalid_username', '[methods] addOutgoingIntegration -> username can\'t be empty'

		if not Match.test integration.urls, [String]
			throw new Meteor.Error 'invalid_urls', '[methods] addOutgoingIntegration -> urls must be an array'

		for url, index in integration.urls
			delete integration.urls[index] if url.trim() is ''

		integration.urls = _.without integration.urls, [undefined]

		if integration.urls.length is 0
			throw new Meteor.Error 'invalid_urls', '[methods] addOutgoingIntegration -> urls is required'

		if integration.channel? and integration.channel[0] not in ['@', '#']
			throw new Meteor.Error 'invalid_channel', '[methods] addOutgoingIntegration -> channel should start with # or @'

		if integration.triggerWords?
			if not Match.test integration.triggerWords, [String]
				throw new Meteor.Error 'invalid_triggerWords', '[methods] addOutgoingIntegration -> triggerWords must be an array'

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
				throw new Meteor.Error 'channel_does_not_exists', "[methods] addOutgoingIntegration -> The channel does not exists"

		user = RocketChat.models.Users.findOne({username: integration.username})

		if not user?
			throw new Meteor.Error 'user_does_not_exists', "[methods] addOutgoingIntegration -> The username does not exists"

		integration.type = 'webhook-outgoing'
		integration.userId = user._id
		integration._createdAt = new Date
		integration._createdBy = RocketChat.models.Users.findOne @userId, {fields: {username: 1}}

		integration._id = RocketChat.models.Integrations.insert integration

		return integration
