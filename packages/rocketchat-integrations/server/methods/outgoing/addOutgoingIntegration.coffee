Meteor.methods
	addOutgoingIntegration: (integration) ->
		if not RocketChat.authz.hasPermission @userId, 'manage-integrations'
			throw new Meteor.Error 'not_authorized'

		if Match.test integration.urls, [String]
			throw new Meteor.Error 'invalid_urls', '[methods] addOutgoingIntegration -> urls must be an array'

		for url, index in urls
			delete urls[index] if url.trim() is ''

		urls = _.without urls, [undefined]

		if integration.urls.length is 0
			throw new Meteor.Error 'invalid_urls', '[methods] addOutgoingIntegration -> urls is required'

		# if integration.channel.trim() is ''
			# throw new Meteor.Error 'invalid_channel', '[methods] addIntegration -> channel can\'t be empty'

		# if integration.channel[0] not in ['@', '#']
		# 	throw new Meteor.Error 'invalid_channel', '[methods] addIntegration -> channel should start with # or @'

		# if not _.isString(integration.username)
		# 	throw new Meteor.Error 'invalid_username', '[methods] addIntegration -> username must be string'

		# if integration.username.trim() is ''
		# 	throw new Meteor.Error 'invalid_username', '[methods] addIntegration -> username can\'t be empty'


		# urlsArr = urls.split('\n')
		# urls = []
		# for url in urlsArr
		# 	urls.push url.trim() if url.trim() isnt ''

		# if urls.length is 0
		# 	return toastr.error TAPi18n.__("You_should_inform_one_url_at_least")

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
			throw new Meteor.Error 'channel_does_not_exists', "[methods] addIntegration -> The channel does not exists"

		user = RocketChat.models.Users.findOne({username: integration.username})

		if not user?
			throw new Meteor.Error 'user_does_not_exists', "[methods] addIntegration -> The username does not exists"

		stampedToken = Accounts._generateStampedLoginToken()
		hashStampedToken = Accounts._hashStampedToken(stampedToken)

		updateObj =
			$push:
				'services.resume.loginTokens':
					hashedToken: hashStampedToken.hashedToken
					integration: true

		integration.token = hashStampedToken.hashedToken
		integration.userId = user._id
		integration._createdAt = new Date
		integration._createdBy = RocketChat.models.Users.findOne @userId, {fields: {username: 1}}

		RocketChat.models.Users.update {_id: user._id}, updateObj

		integration._id = RocketChat.models.Integrations.insert integration

		return integration
