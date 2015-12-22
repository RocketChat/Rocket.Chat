Meteor.methods
	addOutgoingIntegration: (integration) ->
		if not RocketChat.authz.hasPermission @userId, 'manage-integrations'
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

		if integration.channel?.trim() isnt '' and integration.channel[0] not in ['@', '#']
			throw new Meteor.Error 'invalid_channel', '[methods] addOutgoingIntegration -> channel should start with # or @'

		if not integration.token? or integration.token?.trim() is ''
			throw new Meteor.Error 'invalid_token', '[methods] addOutgoingIntegration -> token is required'

		if integration.triggerWords?
			if not Match.test integration.triggerWords, [String]
				throw new Meteor.Error 'invalid_triggerWords', '[methods] addOutgoingIntegration -> triggerWords must be an array'

			for triggerWord, index in integration.triggerWords
				delete integration.triggerWords[index] if triggerWord.trim() is ''

			integration.triggerWords = _.without integration.triggerWords, [undefined]

			if integration.triggerWords.length is 0 and not integration.channel?
				throw new Meteor.Error 'invalid_triggerWords', '[methods] addOutgoingIntegration -> triggerWords is required if channel is empty'


		if integration.channel?.trim() isnt ''
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

		integration.userId = user._id
		integration._createdAt = new Date
		integration._createdBy = RocketChat.models.Users.findOne @userId, {fields: {username: 1}}

		integration._id = RocketChat.models.Integrations.insert integration

		return integration
