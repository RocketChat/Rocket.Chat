RocketChat.API.v1.addRoute 'info', authRequired: false,
	get: -> RocketChat.Info


RocketChat.API.v1.addRoute 'me', authRequired: true,
	get: ->
		return _.pick @user, [
			'_id'
			'name'
			'emails'
			'status'
			'statusConnection'
			'username'
			'utcOffset'
			'active'
			'language'
		]


# Send Channel Message
RocketChat.API.v1.addRoute 'chat.messageExamples', authRequired: true,
	get: ->
		return RocketChat.API.v1.success
			body: [
				token: Random.id(24)
				channel_id: Random.id()
				channel_name: 'general'
				timestamp: new Date
				user_id: Random.id()
				user_name: 'rocket.cat'
				text: 'Sample text 1'
				trigger_word: 'Sample'
			,
				token: Random.id(24)
				channel_id: Random.id()
				channel_name: 'general'
				timestamp: new Date
				user_id: Random.id()
				user_name: 'rocket.cat'
				text: 'Sample text 2'
				trigger_word: 'Sample'
			,
				token: Random.id(24)
				channel_id: Random.id()
				channel_name: 'general'
				timestamp: new Date
				user_id: Random.id()
				user_name: 'rocket.cat'
				text: 'Sample text 3'
				trigger_word: 'Sample'
			]


# Send Channel Message
RocketChat.API.v1.addRoute 'chat.postMessage', authRequired: true,
	post: ->
		channel = @bodyParams.channel
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
					return RocketChat.API.v1.failure 'invalid-channel'

				rid = room._id
				if room.t is 'c'
					Meteor.runAsUser @userId, ->
						Meteor.call 'joinRoom', room._id

			when '@'
				roomUser = RocketChat.models.Users.findOne
					$or: [
						{_id: channel}
						{username: channel}
					]

				if not roomUser?
					return RocketChat.API.v1.failure 'invalid-channel'

				rid = [@useId, roomUser._id].sort().join('')
				room = RocketChat.models.Rooms.findOne(rid)

				if not room
					Meteor.runAsUser @userId, ->
						Meteor.call 'createDirectMessage', roomUser.username
						room = RocketChat.models.Rooms.findOne(rid)

			else
				return RocketChat.API.v1.failure 'invalid-channel-type'

		message =
			alias: @bodyParams.username or @bodyParams.alias
			msg: _.trim(@bodyParams.text or @bodyParams.msg or '')
			attachments: @bodyParams.attachments
			parseUrls: false
			bot:
				u: @userId
			groupable: false

		if @bodyParams.icon_url? or @bodyParams.avatar?
			message.avatar = @bodyParams.icon_url or @bodyParams.avatar
		else if @bodyParams.icon_emoji? or @bodyParams.emoji?
			message.emoji = @bodyParams.icon_emoji or @bodyParams.emoji

		if _.isArray message.attachments
			for attachment in message.attachments
				if attachment.msg
					attachment.text = _.trim(attachment.msg)
					delete attachment.msg

		message = RocketChat.sendMessage @user, message, room, {}

		return RocketChat.API.v1.success
			ts: Date.now()
			channel: channel
			message: message


# Set Channel Topic
RocketChat.API.v1.addRoute 'channels.setTopic', authRequired: true,
	post: ->
		if not @bodyParams.channel?
			return RocketChat.API.v1.failure 'Body param "channel" is required'

		if not @bodyParams.topic?
			return RocketChat.API.v1.failure 'Body param "topic" is required'

		unless RocketChat.authz.hasPermission(@userId, 'edit-room', @bodyParams.channel)
			return RocketChat.API.v1.unauthorized()

		if not RocketChat.saveRoomTopic(@bodyParams.channel, @bodyParams.topic)
			return RocketChat.API.v1.failure 'invalid_channel'

		return RocketChat.API.v1.success
			topic: @bodyParams.topic


# Create Channel
RocketChat.API.v1.addRoute 'channels.create', authRequired: true,
	post: ->
		if not @bodyParams.name?
			return RocketChat.API.v1.failure 'Body param "name" is required'

		if not RocketChat.authz.hasPermission(@userId, 'create-c')
			return RocketChat.API.v1.unauthorized()

		id = undefined
		try
			Meteor.runAsUser this.userId, =>
				id = Meteor.call 'createChannel', @bodyParams.name, []
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message

		return RocketChat.API.v1.success
			channel: RocketChat.models.Rooms.findOne({_id: id.rid})
