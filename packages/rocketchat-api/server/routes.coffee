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
			channel: RocketChat.models.Rooms.findOne({_id: id.rid})


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
			channel: RocketChat.models.Rooms.findOne({_id: @bodyParams.roomId})


# List all users
RocketChat.API.v1.addRoute 'users.list', authRequired: true,
	get: ->
		if RocketChat.authz.hasRole(@userId, 'admin') is false
			return RocketChat.API.v1.unauthorized()

		return { users: RocketChat.models.Users.find().fetch() }


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
			body:[name: @bodyParams.userId ]
			
			
### Create Private Group
 example data:
  {"name":"room5","members":["Jeff","Larry","Stephen"]}
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
			body:[group: RocketChat.models.Rooms.findOne({_id: id.rid})]		


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
				
				
### Retrieve integrations
requires manage-integrations role 
**Note make sure you encode all channel/private rooms  because they start with '#' === '%23' 
Example string ('http://your url here : 3000/api/v1/roomIntegrations.id/%23testRoom/list',headers={'X-User-Id':'user_token','X-Auth-Token':'user_token'})
###
RocketChat.API.v1.addRoute 'roomIntgrations.id/:channel/list', authRequired: true,
	get: ->
		
		if RocketChat.authz.hasPermission(@userId, 'manage-integrations') is false
			return RocketChat.API.v1.unauthorized()
		try	
			this.reaponse.setTimeout(1000)			
			id = RocketChat.models.Integrations.find({"channel":decodeURIComponent(@urlParams.channel)}).fetch()
			return RocketChat.API.v1.success
				body: [ status: 'success', Integrations: id]
		catch e 
			return RocketChat.API.v1.failure e.name + ': ' + e.message
		

###retrieve a complete list of all integrations
requires manage-integrations role 
###
RocketChat.API.v1.addRoute 'roomIntegrations.list', authRequired: true,
	get: ->
	
		if RocketChat.authz.hasPermission(@userId, 'manage-integrations') is false
			return RocketChat.API.v1.unauthorized()
		try 
			this.response.setTimeout (1000)
			id = RocketChat.models.Integrations.find().fetch()
			return RocketChat.API.v1.success
				body:[Integrations: id]
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message
		
		
### Create outgoing webhooks,
user must also have manage-integrations role
creating a push point for messages to be push to from Rocket Chat.
###		
RocketChat.API.v1.addRoute 'outgoingWebhook', authRequired: true,
	post: ->
	
		if RocketChat.authz.hasPermission(@userId, 'manage-integrations') is false
			return RocketChat.API.v1.unauthorized()
	
		if not @bodyParams.name?
			return RocketChat.API.v1.failure 'Body param "name" is required'
			
		if not @bodyParams.userid?
			return RocketChat.API.v1.failure 'Body param "userid" is required'
			
		if not @bodyParams.authToken?
			return RocketChat.API.v1.failure 'Body param "authToken" is required'
			
		if not @bodyParams.channel?
			return RocketChat.API.v1.failure 'Body param "channel" is required'
				
		if not @bodyParams.roomName?
			return RocketChat.API.v1.failure 'Body param "roomName" is required'
					
		if not @bodyParams.enabled?
			return RocketChat.API.v1.failure 'Body param "enabled" is required'
				
		if not @bodyParams.urls?
			return RocketChat.API.v1.failure 'Body param "urls" is required'
					
		try
			this.response.setTimeout (1000 * @bodyParams.name.length)
			integration ={ userid:@bodyParams.userid, auth:@bodyParams.authToken, name:@bodyParams.name, enabled:@bodyParams.enabled, name:@bodyParams.roomName, channel:@bodyParams.channel,
			triggerWords:@bodyParams.triggerWords, urls:@bodyParams.urls, username:@bodyParams.username, alias:@bodyParams.alias, avatar:@bodyParams.avatar, emoji:@bodyParams.emoji, token:@bodyParams.token, 
			scriptEnable:@bodyParams.scriptEnabled, script:@bodyParams.script }
				
			Meteor.runAsUser this.userId, () =>
				Meteor.call 'addOutgoingIntegration', integration
			return RocketChat.API.v1.success
				body:[list:integration]
		catch e
			return RocketChat.API.v1.failure e.name + ': ' + e.message
		

### Remove Outgoing Webhook
user must also have admin role 
@apiParam {json} An array of intergration webhooks in the body of the POST. 'integration' is integrations name
use RocketChat.API.v1.addRoute 'roomIntegrations' method to aquire a list of all webhooks to capture webhook _ids or use ':channel/roomIntgrations' to aquire 
a list from a specfic channel or group (private room).

@apiParamExample {json} POST Request Body example:
  {
    'integrationId':[ 'integrations_id1','integrations_id2']
  }	
###			
RocketChat.API.v1.addRoute 'removeOutgoingWebhook', authRequired: true,
	delete: ->
	
		if RocketChat.authz.hasPermission(@userId, 'manage-integrations') is false
			return RocketChat.API.v1.unauthorized()
				
		try
			this.response.setTimeout (1000)
			ids=[]
			Meteor.runAsUser this.userId, () =>
				(ids[i]=Meteor.call 'deleteOutgoingIntegration', incoming) for incoming, i in @bodyParams.integrationId
			return RocketChat.API.v1.success
				body: [deleted : @bodyParams.integrationId ]
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
	
			