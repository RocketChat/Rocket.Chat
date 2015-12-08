Api = new Restivus
	enableCors: false
	apiPath: 'hooks/'
	auth:
		user: ->
			user = RocketChat.models.Users.findOne
				_id: @request.params.userId
				'services.resume.loginTokens.hashedToken': @request.params.token

			return user: user


Api.addRoute ':integrationId/:userId/:token', authRequired: true,
	post: ->
		integration = RocketChat.models.Integrations.findOne(@urlParams.integrationId)
		user = RocketChat.models.Users.findOne(@userId)

		channel = @bodyParams.channel or integration.channel
		channelType = channel[0]
		channel = channel.substr(1)

		switch channelType
			when '#'
				room = RocketChat.models.Rooms.findOne
					$or: [
						{_id: channel}
						{name: channel}
					]

				if not room?
					return {} =
						statusCode: 400
						body:
							success: false
							error: 'invalid-channel'

				rid = room._id
				Meteor.runAsUser user._id, ->
					Meteor.call 'joinRoom', room._id

			when '@'
				roomUser = RocketChat.models.Users.findOne
					$or: [
						{_id: channel}
						{username: channel}
					]

				if not roomUser?
					return {} =
						statusCode: 400
						body:
							success: false
							error: 'invalid-channel'

				rid = [user._id, roomUser._id].sort().join('')
				room = RocketChat.models.Rooms.findOne(rid)

				if not room
					Meteor.runAsUser user._id, ->
						Meteor.call 'createDirectMessage', roomUser._id
						room = RocketChat.models.Rooms.findOne(rid)

			else
				return {} =
					statusCode: 400
					body:
						success: false
						error: 'invalid-channel-type'

		message =
			msg: @bodyParams.text

		RocketChat.sendMessage user, message, room, {}

		return {} =
			statusCode: 200
			body:
				success: true
