Meteor.methods
	updateIntegration: (integrationId, integration) ->
		if not _.isString(integration.channel)
			throw new Meteor.Error 'invalid_channel', '[methods] addIntegration -> channel must be string'

		if integration.channel.trim() is ''
			throw new Meteor.Error 'invalid_channel', '[methods] addIntegration -> channel can\'t be empty'

		if integration.channel[0] not in ['@', '#']
			throw new Meteor.Error 'invalid_channel', '[methods] addIntegration -> channel should start with # or @'

		if not RocketChat.models.Integrations.findOne(integrationId)?
			throw new Meteor.Error 'invalid_integration', '[methods] addIntegration -> integration not found'

		record = undefined
		switch integration.channel[0]
			when '#'
				record = RocketChat.models.Rooms.findOne
					$or: [
						{_id: integration.channel}
						{name: integration.channel}
					]
			when '@'
				record = RocketChat.models.Users.findOne
					$or: [
						{_id: integration.channel}
						{username: integration.channel}
					]

		if record is undefined
			throw new Meteor.Error 'channel_does_not_exists', "[methods] addIntegration -> The channel does not exists"

		RocketChat.models.Integrations.update integrationId,
			$set:
				name: integration.name
				channel: integration.channel

		return RocketChat.models.Integrations.findOne(integrationId)
