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


