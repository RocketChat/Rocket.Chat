### Retrieve integrations for a specific room. Requires `manage-integrations role`.

Room name needs to be URL encoded, as the identifiers begin with characters
that are not URL safe (e.g., '#' for channels and groups and '@' for direct messages). Example:

'http://domain.com:3000/api/v1/room/name/%23testRoom/integrations'
###
RocketChat.API.v1.addRoute 'room/name/:rname/integrations', authRequired: true,
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

		if RocketChat.authz.hasPermission(@userId, 'create-p') is false
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


### List direct rooms currently registered with the server. Requires `admin` role.

Pagination controlled by the page and items query parameters. Defaults: page=1, items=100.

@queryparam page (int, default=1): Page to retrieve
@queryparam items (int, default=100): Number of items to include in each page

###
RocketChat.API.v1.addRoute 'room/direct.list', authRequired: true,

	get: ->

		if RocketChat.authz.hasPermission(@userId, 'create-p') is false
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
