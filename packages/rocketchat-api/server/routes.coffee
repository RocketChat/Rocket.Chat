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


# Update Channel Message
RocketChat.API.v1.addRoute 'chat.update', authRequired: true,
	post: ->
		try

			# Verify request structure
			check @bodyParams,
				messageId: String
				msg: String

			msg = RocketChat.models.Messages.findOneById(@bodyParams.messageId)

			# Ensure that message exists
			if not msg
				return RocketChat.API.v1.failure 'invalid_message'
			if not msg?.u?._id == @userId
				return RocketChat.API.v1.unauthorized 'message userId does not match logged in user'

			# Ensure that editing messages is enabled
			if not RocketChat.settings.get 'Message_AllowEditing'
				return RocketChat.API.v1.failure 'editing_disabled'

			# Update message
			Meteor.runAsUser @userId, () =>
				Meteor.call 'updateMessage', { _id: msg._id, msg: @bodyParams.msg, rid: msg.rid }
			return RocketChat.API.v1.success
				message: RocketChat.models.Messages.findOneById(@bodyParams.messageId)

		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message


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


### List all users for the server. Requires the admin role.

Message history is paginated. Older messages can be retrieved by incrementing the page and items parameters.

@queryparam page (int, default=1): Page to retrieve
@queryparam items (int, default=100): Number of items to include in each page

###
RocketChat.API.v1.addRoute 'users.list', authRequired: true,
	get: ->
		if RocketChat.authz.hasRole(@userId, 'admin') is false
			return RocketChat.API.v1.unauthorized()

		rpage = if @queryParams.page then Number(@queryParams.page) else 1
		ritems = if @queryParams.items then Number(@queryParams.items) else 100
		users = RocketChat.models.Users.find({}, { limit: ritems, skip: (rpage-1)*ritems }).fetch()
		
		return {
			users: users,
			page: rpage,
			items: users.length,
			total: RocketChat.models.Users.find().count(),
		}


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

			Meteor.runAsUser @userId, =>
				RocketChat.saveUser(@bodyParams.userId, userData)

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


# Delete Users
RocketChat.API.v1.addRoute 'user.delete', authRequired: true,
	post: ->
		if not @bodyParams.userId?
			return RocketChat.API.v1.failure 'Body param "userId" is required'

		id = undefined
		try
			if not RocketChat.authz.hasPermission(@userId, 'delete-user')
				return RocketChat.API.v1.unauthorized()

			Meteor.runAsUser @userId, =>
				id = Meteor.call 'deleteUser', @bodyParams.userId, []
		
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message

		return RocketChat.API.v1.success
			user: @bodyParams.userId
			
			
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
