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
		try
			messageReturn = processWebhookMessage @bodyParams, @user

			if not messageReturn?
				return RocketChat.API.v1.failure 'unknown-error'

			return RocketChat.API.v1.success
				ts: Date.now()
				channel: messageReturn.channel
				message: messageReturn.message
		catch e
			return RocketChat.API.v1.failure e.error

# Set Channel Topic
RocketChat.API.v1.addRoute 'channels.setTopic', authRequired: true,
	post: ->
		if not @bodyParams.channel?
			return RocketChat.API.v1.failure 'Body param "channel" is required'

		if not @bodyParams.topic?
			return RocketChat.API.v1.failure 'Body param "topic" is required'

		unless RocketChat.authz.hasPermission(@userId, 'edit-room', @bodyParams.channel)
			return RocketChat.API.v1.unauthorized()

		if not RocketChat.saveRoomTopic(@bodyParams.channel, @bodyParams.topic, @user)
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
			channel: RocketChat.models.Rooms.findOneById(id.rid)

RocketChat.API.v1.addRoute 'channels.history', authRequired: true,
	get: ->
		if not @queryParams.roomId?
			return RocketChat.API.v1.failure 'Query parameter "roomId" is required.'

		rid = @queryParams.roomId

		latestDate = new Date
		if @queryParams.latest?
			latestDate = new Date(@queryParams.latest)

		oldestDate = undefined
		if @queryParams.oldest?
			oldestDate = new Date(@queryParams.oldest)

		inclusive = false
		if @queryParams.inclusive?
			inclusive = @queryParams.inclusive

		count = 20
		if @queryParams.count?
			count = parseInt @queryParams.count

		unreads = false
		if @queryParams.unreads?
			unreads = @queryParams.unreads

		result = {}

		try
			Meteor.runAsUser this.userId, =>
				result = Meteor.call 'getChannelHistory', { rid, latest: latestDate, oldest: oldestDate, inclusive, count, unreads }
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message

		return RocketChat.API.v1.success
			result: result

RocketChat.API.v1.addRoute 'channels.cleanHistory', authRequired: true,
	post: ->
		if not @bodyParams.roomId?
			return RocketChat.API.v1.failure 'Body parameter "roomId" is required.'

		roomId = @bodyParams.roomId

		if not @bodyParams.latest?
			return RocketChat.API.v1.failure 'Body parameter "latest" is required.'

		if not @bodyParams.oldest?
			return RocketChat.API.v1.failure 'Body parameter "oldest" is required.'

		latest = new Date(@bodyParams.latest)
		oldest = new Date(@bodyParams.oldest)

		inclusive = false
		if @bodyParams.inclusive?
			inclusive = @bodyParams.inclusive

		try
			Meteor.runAsUser this.userId, =>
				Meteor.call 'cleanChannelHistory', { roomId, latest, oldest, inclusive }
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message

		return RocketChat.API.v1.success
			success: true

# List Private Groups a user has access to
RocketChat.API.v1.addRoute 'groups.list', authRequired: true,
	get: ->
		roomIds = _.pluck RocketChat.models.Subscriptions.findByTypeAndUserId('p', @userId).fetch(), 'rid'
		return { groups: RocketChat.models.Rooms.findByIds(roomIds).fetch() }

# Add All Users to Channel
RocketChat.API.v1.addRoute 'channel.addall', authRequired: true,
	post: ->

		id = undefined
		try
			Meteor.runAsUser this.userId, =>
				id = Meteor.call 'addAllUserToRoom', @bodyParams.roomId, []
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message

		return RocketChat.API.v1.success
			channel: RocketChat.models.Rooms.findOneById(@bodyParams.roomId)

# List all users
RocketChat.API.v1.addRoute 'users.list', authRequired: true,
	get: ->
		if RocketChat.authz.hasRole(@userId, 'admin') is false
			return RocketChat.API.v1.unauthorized()

		return { users: RocketChat.models.Users.find().fetch() }

# Create user
RocketChat.API.v1.addRoute 'users.create', authRequired: true,
	post: ->
		try
			check @bodyParams,
				email: String
				name: String
				password: String
				username: String
				role: Match.Maybe(String)
				joinDefaultChannels: Match.Maybe(Boolean)
				requirePasswordChange: Match.Maybe(Boolean)
				sendWelcomeEmail: Match.Maybe(Boolean)
				verified: Match.Maybe(Boolean)
				customFields: Match.Maybe(Object)

			# check username availability first (to not create an user without a username)
			try
				nameValidation = new RegExp '^' + RocketChat.settings.get('UTF8_Names_Validation') + '$'
			catch
				nameValidation = new RegExp '^[0-9a-zA-Z-_.]+$'

			if not nameValidation.test @bodyParams.username
				return RocketChat.API.v1.failure 'Invalid username'

			unless RocketChat.checkUsernameAvailability @bodyParams.username
				return RocketChat.API.v1.failure 'Username not available'

			userData = {}

			newUserId = RocketChat.saveUser(@userId, @bodyParams)

			if @bodyParams.customFields?
				RocketChat.saveCustomFields(newUserId, @bodyParams.customFields)

			user = RocketChat.models.Users.findOneById(newUserId)

			if typeof @bodyParams.joinDefaultChannels is 'undefined' or @bodyParams.joinDefaultChannels
				RocketChat.addUserToDefaultChannels(user)

			return RocketChat.API.v1.success
				user: user
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message

# Update user
RocketChat.API.v1.addRoute 'user.update', authRequired: true,
	post: ->
		try
			check @bodyParams,
				userId: String
				data:
					email: Match.Maybe(String)
					name: Match.Maybe(String)
					password: Match.Maybe(String)
					username: Match.Maybe(String)
					role: Match.Maybe(String)
					joinDefaultChannels: Match.Maybe(Boolean)
					requirePasswordChange: Match.Maybe(Boolean)
					sendWelcomeEmail: Match.Maybe(Boolean)
					verified: Match.Maybe(Boolean)
					customFields: Match.Maybe(Object)

			userData = _.extend({ _id: @bodyParams.userId }, @bodyParams.data)

			RocketChat.saveUser(@userId, userData)

			if @bodyParams.data.customFields?
				RocketChat.saveCustomFields(@bodyParams.userId, @bodyParams.data.customFields)

			return RocketChat.API.v1.success
				user: RocketChat.models.Users.findOneById(@bodyParams.userId)
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message

# Get User Information
RocketChat.API.v1.addRoute 'user.info', authRequired: true,
	post: ->
		if RocketChat.authz.hasRole(@userId, 'admin') is false
			return RocketChat.API.v1.unauthorized()

		return { user: RocketChat.models.Users.findOneByUsername @bodyParams.name }

# Get User Presence
RocketChat.API.v1.addRoute 'user.getpresence', authRequired: true,
	post: ->
		return { user: RocketChat.models.Users.findOne( { username: @bodyParams.name} , {fields: {status: 1}} ) }

# Delete User
RocketChat.API.v1.addRoute 'users.delete', authRequired: true,
	post: ->
		if not @bodyParams.userId?
			return RocketChat.API.v1.failure 'Body param "userId" is required'

		if not RocketChat.authz.hasPermission(@userId, 'delete-user')
			return RocketChat.API.v1.unauthorized()

		id = undefined
		try
			Meteor.runAsUser this.userId, =>
				id = Meteor.call 'deleteUser', @bodyParams.userId, []
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message

		return RocketChat.API.v1.success

# Set user's avatar
RocketChat.API.v1.addRoute 'users.setAvatar', authRequired: true,
	post: ->
		try
			check @bodyParams,
				avatarUrl: Match.Maybe(String)

			user = Meteor.users.findOne(@userId)

			if @bodyParams.avatarUrl
				RocketChat.setUserAvatar(user, @bodyParams.avatarUrl, '', 'url')
			else
				Busboy = Npm.require('busboy')
				busboy = new Busboy headers: @request.headers
				Meteor.wrapAsync((callback) =>
					busboy.on 'file', Meteor.bindEnvironment (fieldname, file, filename, encoding, mimetype) =>
						if fieldname isnt 'image'
							return callback(new Meteor.Error 'invalid-field')

						imageData = []
						file.on 'data', Meteor.bindEnvironment (data) ->
							imageData.push data

						file.on 'end', Meteor.bindEnvironment () =>
							RocketChat.setUserAvatar(user, Buffer.concat(imageData), mimetype, 'rest')
							callback()

					@request.pipe busboy
				)()
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message

		return RocketChat.API.v1.success()

# Create Private Group
RocketChat.API.v1.addRoute 'groups.create', authRequired: true,
	post: ->
		if not @bodyParams.name?
			return RocketChat.API.v1.failure 'Body param "name" is required'

		if not RocketChat.authz.hasPermission(@userId, 'create-p')
			return RocketChat.API.v1.unauthorized()

		id = undefined
		try
			if not @bodyParams.members?
				Meteor.runAsUser this.userId, =>
					id = Meteor.call 'createPrivateGroup', @bodyParams.name, []
			else
				Meteor.runAsUser this.userId, =>
					id = Meteor.call 'createPrivateGroup', @bodyParams.name, @bodyParams.members, []
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message

		return RocketChat.API.v1.success
			group: RocketChat.models.Rooms.findOneById(id.rid)
