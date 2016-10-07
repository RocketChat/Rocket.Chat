# Rocket.Chat Extended API Methods: Provide methods for working with 


#* Room API: Provides a unified interface for working with channels, groups, and direct messages *#


# Retrieve information for room. Provides lookup by room name (`name`) or room ID (`roomId`)
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


### Retrieve integrations for a specific room. Requires `manage-integrations role`.

Room name needs to be URL encoded, as the identifiers begin with characters
that are not URL safe (e.g., '#' for channels and groups and '@' for direct messages). Example:

'http://domain.com:3000/api/v1/room/%23testRoom/integrations'
###
RocketChat.API.v1.addRoute 'room/:rname/integrations', authRequired: true,
	get: ->
		
		if RocketChat.authz.hasPermission(@userId, 'manage-integrations') is false
			return RocketChat.API.v1.unauthorized()
		
		try	
			this.response.setTimeout(1000)			
			return RocketChat.API.v1.success
				integrations: RocketChat.models.Integrations.find({
						"channel":decodeURIComponent(@urlParams.rname)
					}).fetch()
		
		catch e 
			return RocketChat.API.v1.failure e.name + ': ' + e.message


### Update a Rocket.Chat room. Supported parameters:

['roomName', 'roomTopic', 'roomDescription', 'roomType', 'readOnly', 'systemMessages', 'default', 'joinCode']

###		
RocketChat.API.v1.addRoute 'room.update', authRequired: true, 
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

				updatedRoom = RocketChat.models.Rooms.findOneById room._id
				return RocketChat.API.v1.success
					room: updatedRoom
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message


# Add user to a channel/group
RocketChat.API.v1.addRoute 'room.addUser', authRequired: true,
	post: ->
		
		try
			this.response.setTimeout (1000 * @userId.length)
			Meteor.runAsUser this.userId, () =>
				(Meteor.call 'addUserToRoom', rid:@bodyParams.room, username:@bodyParams.username)
			console.log status: 'success', rid:@bodyParams.room, username:@bodyParams.username
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message

		return RocketChat.API.v1.success
			room: @bodyParams.room
			user: @bodyParams.username


### Remove Rocket.Chatroom. User must also have delete-p role.

@param `roomId`: ID of the room to be removed
@param `name`: Name of the room to be removed.

###
RocketChat.API.v1.addRoute 'room.delete', authRequired: true,
	post: ->
		
		if RocketChat.authz.hasPermission(@userId, 'delete-p') is false
			return RocketChat.API.v1.unauthorized()
		
		try
			Meteor.runAsUser this.userId, () =>
				Meteor.call 'eraseRoom', @bodyParams.roomId or @bodyParams.name

		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message
		
		return RocketChat.API.v1.success
			room: @bodyParams.roomId or @bodyParams.name



### Retrieve messages for a specific room. Requires manage-messages role. URL parameter accepts the room ID.

Message history is paginated. Older messages can be retrieved by incrementing the page and items parameters.

@queryparam page (int, default=1): Page to retrieve
@queryparam items (int, default=100): Number of items to include in each page

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
				messages: msgs
				page: rpage
				items: msgs.length
				total: RocketChat.models.Messages.findVisibleByRoomId(@urlParams.rid).count()

		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message


### List direct rooms currently registered with the server. Requires `admin` role.

Pagination controlled by the page and items query parameters. Defaults: page=1, items=100.

@queryparam page (int, default=1): Page to retrieve
@queryparam items (int, default=100): Number of items to include in each page

###
RocketChat.API.v1.addRoute 'room/direct.list', authRequired: true,
	
	get: ->	
		
		if RocketChat.authz.hasRole(@userId, 'admin') is false
			return RocketChat.API.v1.unauthorized()
		
		try
			this.response.setTimeout (1000)
			
			rpage = if @queryParams.page then Number(@queryParams.page) else 1
			ritems = if @queryParams.items then Number(@queryParams.items) else 100
			
			rooms = RocketChat.models.Rooms.findByType('d', {
					sort: { msgs:-1 }, skip: (rpage-1)*ritems, limit: ritems
				}).fetch()

			return RocketChat.API.v1.success
				rooms: rooms
				page: rpage
				items: rooms.length
				total: RocketChat.models.Rooms.findByType('d').count()
		
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message


#* Integrations API: Manage *#


### Retrieve a paginated list of all integrations. Requires manage-integrations role.

Pagination controlled by the page and items query parameters. Defaults: page=1, items=100.

@queryparam page (int, default=1): Page to retrieve
@queryparam items (int, default=100): Number of items to include in each page

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
				total: RocketChat.models.Integrations.find().count()
		
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message


### Create outgoing webhook. User must have manage-integrations role.
###		
RocketChat.API.v1.addRoute 'integrations/outgoingWebhook.create', authRequired: true,
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


### Remove outgoing webhook. User must have manage-integrations permissions.

@parama integrationId (str): The ID of the integration to remove.
###			
RocketChat.API.v1.addRoute 'integrations/outgoingWebhook.delete', authRequired: true,
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