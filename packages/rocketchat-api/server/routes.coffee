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

			return RocketChat.API.v1.success
				user: RocketChat.models.Users.findOneById(newUserId)
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
			body:[user: @bodyParams.userId ]
			
			
### Create Private Group
Request example:
  { "name": "room5", "members": ["Jeff","Larry","Stephen"]}
###
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


#list All Private Groups, requires api-groups-list permissions (admin).		
RocketChat.API.v1.addRoute 'AllGroup.list', authRequired: true,
	get: ->
		
		if RocketChat.authz.hasPermission(@userId, 'api-groups-list') is false
			console.log '[restapi] api/v1/AllGroup.list -> '.red, "User does not have 'api-groups-list' permission"
			return RocketChat.API.v1.unauthorized()
		try
			this.response.setTimeout (1000)
			rooms = RocketChat.models.Rooms.findByType('p', { sort: { msgs:-1 } }).fetch()
			
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message
			
		return RocketChat.API.v1.success
				body:[list: rooms]
				
					
#list All Direct Groups		
RocketChat.API.v1.addRoute 'directRoom.list', authRequired: true,
	get: ->
		if RocketChat.authz.hasPermission(@userId, 'api-direct-list') is false
			return RocketChat.API.v1.unauthorized()
		try
			this.response.setTimeout (1000)
			rooms = RocketChat.models.Rooms.findByType('d', { sort: { msgs:-1 } }).fetch()
			
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message	
			
		return RocketChat.API.v1.success
				body:[list: rooms]
				
				
# addUser to a channel/group
RocketChat.API.v1.addRoute 'addUser', authRequired: true,
	post: ->
		
		try
			this.response.setTimeout (1000 * @userId.length)
			Meteor.runAsUser this.userId, () =>
				(Meteor.call 'addUserToRoom', rid:@bodyParams.room, username:@bodyParams.username)
			console.log status: 'success', rid:@bodyParams.room, username:@bodyParams.username
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message

		return RocketChat.API.v1.success
				body:[status: 'success', rid:@bodyParams.room, username:@bodyParams.username]
				
				
### Remove rooms
any type i.e. channels/private/direct message room
user must also have delete-p role 
pass room _id in body of data (  data='{"name":[" room _id"]}'  )				
###
RocketChat.API.v1.addRoute 'bulk/removeGroup', authRequired: true,
	delete: ->
		
		if RocketChat.authz.hasPermission(@userId, 'delete-p') is false
			return RocketChat.API.v1.unauthorized()
		try
			this.response.setTimeout (1000 * @bodyParams.name.length)
			ids = []
			Meteor.runAsUser this.userId, () =>
				(ids[i] = Meteor.call 'eraseRoom', incoming) for incoming,i in @bodyParams.name
			console.log status: 'success', ids: ids  
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message
		
		return RocketChat.API.v1.success
			body: [ name:@bodyParams.name]


# Get Room Information
RocketChat.API.v1.addRoute 'room.info', authRequired: true,
	post: ->
		
		if RocketChat.authz.hasRole(@userId, 'admin') is false
			return RocketChat.API.v1.unauthorized()

		try
			check @bodyParams,
				roomId: Match.Maybe(String)
				name: Match.Maybe(String)
			
			this.response.setTimeout(1000)
			room = RocketChat.models.Rooms.findOneById @bodyParams.roomId
			if !room
				room = RocketChat.models.Rooms.findOneByName @bodyParams.name

			return { room: room }
		
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message
				
				
### Retrieve integrations for a specific room
Requires manage-integrations role. The room channel needs to be URL encoded, as the names begin with characters
that are not URL safe (e.g., '#' and '@'). Example:
'http://domain.com:3000/api/v1/room/%23testRoom/integrations'
###
RocketChat.API.v1.addRoute 'room/:rid/integrations', authRequired: true,
	get: ->
		
		if RocketChat.authz.hasPermission(@userId, 'manage-integrations') is false
			return RocketChat.API.v1.unauthorized()
		
		try	
			this.response.setTimeout(1000)			
			return RocketChat.API.v1.success
				integrations: RocketChat.models.Integrations.find({"channel":decodeURIComponent(@urlParams.rid)}).fetch()
		
		catch e 
			return RocketChat.API.v1.failure e.name + ': ' + e.message


### Retrieve messages for a specific room
Requires manage-messages role. The room channel needs to be URL encoded, as the names begin with characters that
are not URL safe (e.g., '#' and '@'). Example:
'http://domain.com:3000/api/room/%23testRoom/history'
###
RocketChat.API.v1.addRoute 'room/:rid/history', authRequired: true,
	get: ->
		if not Meteor.call('canAccessRoom', @urlParams.rid, this.userId)
			return RocketChat.API.v1.unauthorized()

		try

			rpage = if @queryParams.page then Number(@queryParams.page) else 1
			ritems = if @queryParams.items then Number(@queryParams.items) else 100
			msgs = RocketChat.models.Messages.findVisibleByRoomId(@urlParams.rid,
					sort:
						ts: -1
					skip: (rpage-1)*ritems
					limit: ritems
				).fetch()
			return RocketChat.API.v1.success
				msgs: msgs
				page: rpage
				items: msgs.length
				total: RocketChat.models.Messages.findVisibleByRoomId(@urlParams.rid).count()

		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message
		

### Retrieve a paginated list of all integrations. 
Pagination controlled by the page and items query parameters. Defaults: page=1, items=100. Requires manage-integrations role.
###
RocketChat.API.v1.addRoute 'integrations.list', authRequired: true,
	get: ->
	
		if RocketChat.authz.hasPermission(@userId, 'manage-integrations') is false
			return RocketChat.API.v1.unauthorized()
		try 
			this.response.setTimeout (1000)
			rpage = if @queryParams.page then Number(@queryParams.page) else 1
			ritems = if @queryParams.items then Number(@queryParams.items) else 100
			integrations = RocketChat.models.Integrations.find({}, { limit: ritems, skip: (rpage-1)*ritems }).fetch()
			return RocketChat.API.v1.success
				integrations: integrations
				page: rpage
				items: integrations.length
				toal: RocketChat.models.Integrations.find().count()
		
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message
		
		
### Create outgoing webhook
User must have manage-integrations role
###		
RocketChat.API.v1.addRoute 'integrations.outgoingWebhook.create', authRequired: true,
	post: ->
	
		if RocketChat.authz.hasPermission(@userId, 'manage-integrations') is false
			return RocketChat.API.v1.unauthorized()
					
		try
			check @bodyParams,				
				name: String
				enabled: Boolean
				username: String
				urls: Array
				channel: Match.Maybe(String)
				alias: Match.Maybe(String)
				avatar: Match.Maybe(String)
				emoji: Match.Maybe(String)
				token: Match.Maybe(String)
				scriptEnabled: Boolean
				script: Match.Maybe(String)

			this.response.setTimeout (1000 * @bodyParams.name.length)
				
			Meteor.runAsUser this.userId, () =>
				Meteor.call 'addOutgoingIntegration', @bodyParams
			return RocketChat.API.v1.success
				integration: RocketChat.models.Integrations.findOne({ 'name': @bodyParams.name })
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message
		

### Remove outgoing webhook
User must have manage-integrations permissions
###			
RocketChat.API.v1.addRoute 'integrations.outgoingWebhook.delete', authRequired: true,
	post: ->
	
		if RocketChat.authz.hasPermission(@userId, 'manage-integrations') is false
			return RocketChat.API.v1.unauthorized()
				
		try

			check @bodyParams,
				integrationId: String

			this.response.setTimeout(1000)
			
			Meteor.runAsUser this.userId, () =>
				Meteor.call 'deleteOutgoingIntegration', @bodyParams.integrationId
			return RocketChat.API.v1.success
				body: [integration: @bodyParams.integrationId]
		
		catch e
			return RocketChat.API.v1.failure  @bodyParams.integrationId, message: e.name + ' :: ' + e.message
			
				
#list direct message room
RocketChat.API.v1.addRoute 'directMessageRooms.list/:room_Id', authRequired: true,
	get: ->
	
		if RocketChat.authz.hasPermission(@userId, 'api-direct-list') is false
			return RocketChat.API.v1.unauthorized()
		try
			this.response.setTimeout (1000)
			rooms = RocketChat.models.Rooms.findByids('@urlParams.room_Id', { sort: { msgs:-1 } }).fetch()
			return RocketChat.API.v1.success
				body: [rooms: rooms]
		catch e
			return RocketChat.API.v1.failure @urlsParams.room_Id, message: e.name + ' :: ' + e.message
		

#list direct message all
RocketChat.API.v1.addRoute 'directMessage.list', authRequired: true,
	get: ->	
		
		if RocketChat.authz.hasPermission(@userId, 'api-direct-list') is false
			return RocketChat.API.v1.unauthorized()
		try
			this.response.setTimeout (1000)
			rooms = RocketChat.models.Rooms.findByType('d', { sort: { msgs:-1 } }).fetch()
			return RocketChat.API.v1.success
				body: [rooms: rooms]
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message

			
###
Update a Rocket.Chat room (channel or group) parameters
['roomName', 'roomTopic', 'roomDescription', 'roomType', 'readOnly', 'systemMessages', 'default', 'joinCode']
###		
RocketChat.API.v1.addRoute 'room.updateRoom', authRequired: true, 
	post: ->
	
		if RocketChat.authz.hasRole(@userId, 'admin') is false
			return RocketChat.API.v1.unauthorized()
		try
			this.response.setTimeout (2000)
			room = RocketChat.models.Rooms.findOneByName @bodyParams.roomName
			Meteor.runAsUser this.userId, () =>
			
				if @bodyParams.newName
					Meteor.call 'saveRoomSettings', room._id, 'roomName', @bodyParams.newName
				if @bodyParams.roomTopic
					Meteor.call 'saveRoomSettings', room._id, 'roomTopic', @bodyParams.roomTopic
				if @bodyParams.roomDescription
					Meteor.call 'saveRoomSettings', room._id, 'roomDescription', @bodyParams.roomDescription
				if @bodyParams.roomType
					Meteor.call 'saveRoomSettings', room._id, 'roomType', @bodyParams.roomType
				if @bodyParams.readOnly
					Meteor.call 'saveRoomSettings', room._id, 'readOnly', @bodyParams.readOnly
				if @bodyParams.archived
					Meteor.call 'saveRoomSettings', room._id, 'archived', @bodyParams.archived
				if @bodyParams.joinCode
					Meteor.call 'saveRoomSettings', room._id, 'joinCode', @bodyParams.joinCode
				return RocketChat.API.v1.success
					body: room:(updatedRoom = RocketChat.models.Rooms.findOneById room._id)
		catch e
			console.log '[routes.coffee] api/v1/admin.updateRoom Error: ', e.message, e.stack
			return RocketChat.API.v1.failure e.name + ': ' + e.message
