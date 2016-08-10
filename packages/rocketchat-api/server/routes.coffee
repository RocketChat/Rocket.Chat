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

# addUser to a channel/private group
RocketChat.API.v1.addRoute 'addUser', authRequired: true,
	post: ->
			if RocketChat.authz.hasPermission(@userId, 'bulk-create-c')
				try
					this.response.setTimeout (1000 * @userId.length)
					Meteor.runAsUser this.userId, () =>
						(Meteor.call 'addUserToRoom', rid:@bodyParams.room, username:@bodyParams.username)
					status: 'success', rid:@bodyParams.room, username:@bodyParams.username
				catch e
					statusCode: 400    # bad request or other errors
					body: status: 'fail', message: e.name + ' :: ' + e.message
			else
				console.log '[restapi] addUserToRoom -> '.red, "User does not have 'bulk-create-c' permission"
				statusCode: 403
				body: status: 'error', message: 'You do not have permission to do this'	
				
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
			group: RocketChat.models.Rooms.findOne({_id: id.rid})

### Remove rooms
any type i.e. channels/private/direct message room
user must also have create-c permission
pass room _id in body of data (  data='{"name":[" room _id"]}'  )				
###
RocketChat.API.v1.addRoute 'bulk/removeGroup', authRequired: true,
	delete: ->
			if RocketChat.authz.hasPermission(@userId, 'bulk-create-c')
				try
					this.response.setTimeout (1000 * @bodyParams.name.length)
					ids = []
					Meteor.runAsUser this.userId, () =>
						(ids[i] = Meteor.call 'eraseRoom', incoming) for incoming,i in @bodyParams.name
					status: 'success', ids: ids  # need to handle error
				catch e
					statusCode: 400    # bad request or other errors
					body: status: 'fail', message: e.name + ' :: ' + e.message
			else
				console.log '[API.v1.] bulk/removePrivateGroups -> '.red, "User does not have 'bulk-create-c' permission"
				statusCode: 403
				body: status: 'error', message: 'You do not have permission to do this'
				
### Retrieve integrations 
**Note make sure you encode all channel/private rooms  because they start with '#' === '%23' 
Example string ('http://your url here : 3000/api/%23testRoom/roomIntegrations',headers={'X-User-Id':'user_token','X-Auth-Token':'user_token'})
###
RocketChat.API.v1.addRoute ':channel/roomIntgrations.list', authRequired: true,
	get: ->
		try
			if not channel?
				id = RocketChat.models.Integrations.find().fetch()
				status: 'success', Integrations: id					
			else 
				id = RocketChat.models.Integrations.find({"channel":decodeURIComponent(@urlParams.channel)}).fetch()
				status: 'success', Integrations: id
		catch e 
			statusCode: 400    # bad request or other errors
			body: status: 'Epic fail', message: e.name + ' :: ' + e.message

### retrieve a complete list of all integrations
Api.addRoute 'roomIntegrations.list', authRequired: true,
	get: ->
		id = RocketChat.models.Integrations.find().fetch()
		status: 'success', Integrations: id				
###


### Create outgoing webhooks,
user must also have create-c permission because
creating a push point for messages to be push to from Rocket Chat.
###		
RocketChat.API.v1.addRoute 'outgoingWebhook', authRequired: true,
	post: ->
			if RocketChat.authz.hasPermission(@userId, 'bulk-create-c')
				try
					this.response.setTimeout (1000 * @bodyParams.name.length)
					integration ={ userid:@bodyParams.userid, auth:@bodyParams.authToken, name:@bodyParams.name, enabled:@bodyParams.enabled, name:@bodyParams.roomName, channel:@bodyParams.channel,
					triggerWords:@bodyParams.triggerWords, urls:@bodyParams.urls, username:@bodyParams.username, alias:@bodyParams.alias, avatar:@bodyParams.avatar, emoji:@bodyParams.emoji, token:@bodyParams.token, 
					scriptEnable:@bodyParams.scriptEnabled, script:@bodyParams.script }
					
					Meteor.runAsUser this.userId, () =>
						Meteor.call 'addOutgoingIntegration', integration
					status: 'success' # need to handle error
				catch e
					statusCode: 400    # bad request or other errors
					body: status: 'yep failled again', message: e.name + ' :: ' + e.message
			else
				console.log '[restapi] api/outgoingWebhook -> '.red, "User does not have 'bulk-create-c' permission"
				statusCode: 403
				body: status: 'error', message: 'You do not have permission to do this'

### Remove Outgoing Webhook
user must also have create-c permission
@apiParam {json} An array of intergration webhooks in the body of the POST. 'integration' is integrations name
use API 'roomIntegrations' method to aquire a list of all webhooks to capture webhook _ids or use ':channel/roomIntgrations' to aquire 
a list from a specfic channel or private room.

@apiParamExample {json} POST Request Body example:
  {
    'integrationId':[ 'integrations_id1','integrations_id2']
  }	
###			
RocketChat.API.v1.addRoute 'removeOutgoingWebhook', authRequired: true,
	delete: ->
			if RocketChat.authz.hasPermission(@userId, 'bulk-create-c')
				try
					this.response.setTimeout (1000)
					ids=[]
					Meteor.runAsUser this.userId, () =>
						(ids[i]=Meteor.call 'deleteOutgoingIntegration', incoming) for incoming, i in @bodyParams.integrationId
					status: 'success', deleted : @bodyParams.integrationId # need to handle error
				catch e
					statusCode: 400  # bad request or other errors
					body: status: 'yep failled again bad request '+ @bodyParams.integrationId, message: e.name + ' :: ' + e.message
			else
				console.log '[restapi] api/outgoingWebhooks -> '.red, "User does not have 'bulk-create-c' permission"
				statusCode: 403
				body: status: 'error', message: 'You do not have permission to do this'

### Create a direct message
user must also have create-c permission
pass in the data the user to connect to. (  data='{"username":"Joe"}'    )  connects the user who's header auth creditials are be used.
to connect two users you must issue command as that user. 
###  				
RocketChat.API.v1.addRoute 'createDirectMessage', authRequired: true,
	post: ->
			try
				this.response.setTimeout (1000)
				Meteor.runAsUser this.userId, () =>
					Meteor.call 'createDirectMessage', @bodyParams.username
				status: 'success', created : @bodyParams.username
			catch e
				statusCode:400 # bad request
				body: status: 'bad request missing pramas ' + @bodyParams.username, message: e.name + ':: ' + e.message
				