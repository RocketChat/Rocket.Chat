Api = new Restivus
	useDefaultAuth: true
	prettyJson: true
	enableCors: false


Api.addRoute 'info', authRequired: false,
	get: -> RocketChat.Info


Api.addRoute 'version', authRequired: false,
	get: ->
		version = {api: '0.1', rocketchat: '0.5'}
		status: 'success', versions: version

#list public rooms 
Api.addRoute 'publicRooms', authRequired: true,
	get: ->
		rooms = RocketChat.models.Rooms.findByType('c', { sort: { msgs:-1 } }).fetch()
		status: 'success', rooms: rooms

#list private rooms		
Api.addRoute 'privateRooms', authRequired: true,
	get: ->
		rooms = RocketChat.models.Rooms.findByType('p', { sort: { msgs:-1 } }).fetch()
		status: 'success', rooms: rooms

#list direct message room
Api.addRoute 'directMessageRooms', authRequired: true,
	get: ->
		rooms = RocketChat.models.Rooms.findByType('d', { sort: { msgs:-1 } }).fetch()
		status: 'success', rooms: rooms
		
###
@api {get} /joinedRooms Get joined rooms.
###
Api.addRoute 'joinedRooms', authRequired: true,
	get: ->
		rooms = RocketChat.models.Rooms.findByContainigUsername(@user.username).fetch()
		status: 'success', rooms: rooms

# join a room
Api.addRoute 'rooms/:id/join', authRequired: true,
	post: ->
		Meteor.runAsUser this.userId, () =>
			Meteor.call('joinRoom', @urlParams.id)
		status: 'success'   # need to handle error

# leave a room
Api.addRoute 'rooms/:id/leave', authRequired: true,
	delete: ->
		Meteor.runAsUser this.userId, () =>
			Meteor.call('leaveRoom', @urlParams.id)
		status: 'success'   # need to handle error


###
@api {get} /rooms/:id/messages?skip=:skip&limit=:limit Get messages in a room.
@apiParam {Number} id         Room ID
@apiParam {Number} [skip=0]   Number of results to skip at the beginning
@apiParam {Number} [limit=50] Maximum number of results to return
###
Api.addRoute 'rooms/:id/messages', authRequired: true,
	get: ->
		try
			rid = @urlParams.id
			# `variable | 0` means converting to int
			skip = @queryParams.skip | 0 or 0
			limit = @queryParams.limit | 0 or 50
			limit = 50 if limit > 50
			if Meteor.call('canAccessRoom', rid, this.userId)
				msgs = RocketChat.models.Messages.findVisibleByRoomId(rid,
					sort:
						ts: -1
					skip: skip
					limit: limit
				).fetch()
				status: 'success', messages: msgs
			else
				statusCode: 403   # forbidden
				body: status: 'fail', message: 'Cannot access room.'
		catch e
			statusCode: 400    # bad request or other errors
			body: status: 'fail', message: e.name + ' :: ' + e.message



# send a message in a room -  POST body should be { "msg" : "this is my message"}
Api.addRoute 'rooms/:id/send', authRequired: true,
	post: ->
		Meteor.runAsUser this.userId, () =>
			console.log @bodyParams.msg
			Meteor.call('sendMessage', {msg: this.bodyParams.msg, rid: @urlParams.id} )
		status: 'success'	#need to handle error

# get list of online users in a room
Api.addRoute 'rooms/:id/online', authRequired: true,
	get: ->
		room = RocketChat.models.Rooms.findOneById @urlParams.id
		online = RocketChat.models.Users.findUsersNotOffline(fields:
			username: 1
			status: 1).fetch()
		onlineInRoom = []
		for user, i in online
			if room.usernames.indexOf(user.username) != -1
				onlineInRoom.push user.username

		status: 'success', online: onlineInRoom

# validate an array of users
Api.testapiValidateUsers =  (users) ->
	for user, i in users
		if user.name?
			if user.email?
				if user.pass?
					try
						nameValidation = new RegExp '^' + RocketChat.settings.get('UTF8_Names_Validation') + '$', 'i'
					catch
						nameValidation = new RegExp '^[0-9a-zA-Z-_.]+$', 'i'

					if nameValidation.test user.name
						if  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+\b/i.test user.email
							continue
		throw new Meteor.Error 'invalid-user-record', "[restapi] bulk/register -> record #" + i + " is invalid"
	return


###
@api {post} /bulk/register  Register multiple users based on an input array.
@apiName register
@apiGroup TestAndAdminAutomation
@apiVersion 0.0.1
@apiDescription  Caller must have 'testagent' or 'adminautomation' role.
NOTE:   remove room is NOT recommended; use Meteor.reset() to clear db and re-seed instead
@apiParam {json} rooms An array of users in the body of the POST.
@apiParamExample {json} POST Request Body example:
  {
    'users':[ {'email': 'user1@user1.com',
               'name': 'user1',
               'pass': 'abc123' },
              {'email': 'user2@user2.com',
               'name': 'user2',
               'pass': 'abc123'},
              ...
            ]
  }
@apiSuccess {json} ids An array of IDs of the registered users.
@apiSuccessExample {json} Success-Response:
  HTTP/1.1 200 OK
  {
    'ids':[ {'uid': 'uid_1'},
            {'uid': 'uid_2'},
            ...
    ]
  }
###
Api.addRoute 'bulk/register', authRequired: true,
	post:
		# restivus 0.8.4 does not support alanning:roles using groups
		#roleRequired: ['testagent', 'adminautomation']
		action: ->
			if RocketChat.authz.hasPermission(@userId, 'bulk-register-user')
				try

					Api.testapiValidateUsers  @bodyParams.users
					this.response.setTimeout (500 * @bodyParams.users.length)
					ids = []
					endCount = @bodyParams.users.length - 1
					for incoming, i in @bodyParams.users
						ids[i] = {uid: Meteor.call 'registerUser', incoming}
						Meteor.runAsUser ids[i].uid, () =>
							Meteor.call 'setUsername', incoming.name
							Meteor.call 'joinDefaultChannels'

					status: 'success', ids: ids
				catch e
					statusCode: 400    # bad request or other errors
					body: status: 'fail', message: e.name + ' :: ' + e.message
			else
				console.log '[restapi] bulk/register -> '.red, "User does not have 'bulk-register-user' permission"
				statusCode: 403
				body: status: 'error', message: 'You do not have permission to do this'




# validate an array of rooms
Api.testapiValidateRooms =  (rooms) ->
	for room, i in rooms
		if room.name?
			if room.members?
				if room.members.length > 1
					try
						nameValidation = new RegExp '^' + RocketChat.settings.get('UTF8_Names_Validation') + '$', 'i'
					catch
						nameValidation = new RegExp '^[0-9a-zA-Z-_.]+$', 'i'

					if nameValidation.test room.name
						continue
		throw new Meteor.Error 'invalid-room-record', "[restapi] bulk/createRoom -> record #" + i + " is invalid"
	return


###
@api {post} /bulk/createRoom Create multiple rooms based on an input array.
@apiName createRoom
@apiGroup TestAndAdminAutomation
@apiVersion 0.0.1
@apiParam {json} rooms An array of rooms in the body of the POST. 'name' is room name, 'members' is array of usernames
@apiParamExample {json} POST Request Body example:
  {
    'rooms':[ {'name': 'room1',
               'members': ['user1', 'user2']
              },
              {'name': 'room2',
               'members': ['user1', 'user2', 'user3']
              }
              ...
            ]
  }
@apiDescription  Caller must have 'testagent' or 'adminautomation' role.
NOTE:   remove room is NOT recommended; use Meteor.reset() to clear db and re-seed instead

@apiSuccess {json} ids An array of ids of the rooms created.
@apiSuccessExample {json} Success-Response:
  HTTP/1.1 200 OK
  {
    'ids':[ {'rid': 'rid_1'},
            {'rid': 'rid_2'},
            ...
    ]
  }
###
Api.addRoute 'bulk/createRoom', authRequired: true,
	post:
		# restivus 0.8.4 does not support alanning:roles using groups
		#roleRequired: ['testagent', 'adminautomation']
		action: ->
			# user must also have create-c permission because
			# createChannel method requires it
			if RocketChat.authz.hasPermission(@userId, 'bulk-create-c')
				try
					this.response.setTimeout (1000 * @bodyParams.rooms.length)
					Api.testapiValidateRooms @bodyParams.rooms
					ids = []
					Meteor.runAsUser this.userId, () =>
						(ids[i] = Meteor.call 'createChannel', incoming.name, incoming.members) for incoming,i in @bodyParams.rooms
					status: 'success', ids: ids   # need to handle error
				catch e
					statusCode: 400    # bad request or other errors
					body: status: 'fail', message: e.name + ' :: ' + e.message
			else
				console.log '[restapi] bulk/createRoom -> '.red, "User does not have 'bulk-create-c' permission"
				statusCode: 403
				body: status: 'error', message: 'You do not have permission to do this'

###
@api {post} /bulk/createPrivateGroup  Create multiple private groups based on an input array.
@apiName createPrivateGroups
@apiGroup TestAndAdminAutomation
@apiVersion 0.0.1
@apiParam {json} rooms An array of groups in the body of the POST. 'name' is group name, 'members' is array of usernames
@apiParamExample {json} POST Request Body example:
  {
    'rooms':[ {'name': 'room1',
               'members': ['user1', 'user2']
  	      },
  	      {'name': 'room2',
               'members': ['user1', 'user2', 'user3']
              }
              ...
            ]
  }
@apiDescription  Caller must have 'testagent' or 'adminautomation' role.
NOTE:   remove room is NOT recommended; use Meteor.reset() to clear db and re-seed instead

@apiSuccess {json} ids An array of ids of the groups created.
@apiSuccessExample {json} Success-Response:
  HTTP/1.1 200 OK
  {
    'ids':[ {'rid': 'rid_1'},
            {'rid': 'rid_2'},
            ...
    ]
  }
###
Api.addRoute 'bulk/createPrivateGroup', authRequired: true,
	post:
		# restivus 0.8.4 does not support alanning:roles using groups
		#roleRequired: ['testagent', 'adminautomation']
		action: ->
			# user must also have create-c permission because
			# createChannel method requires it
			if RocketChat.authz.hasPermission(@userId, 'bulk-create-c')
				try
					this.response.setTimeout (1000 * @bodyParams.rooms.length)
					Api.testapiValidateRooms @bodyParams.rooms
					ids = []
					Meteor.runAsUser this.userId, () =>
						(ids[i] = Meteor.call 'createPrivateGroup', incoming.name, incoming.members) for incoming,i in @bodyParams.rooms
					status: 'success', ids: ids   # need to handle error
				catch e
					statusCode: 400    # bad request or other errors
					body: status: 'fail', message: e.name + ' :: ' + e.message
			else
				console.log '[restapi] bulk/createPrivateGroups -> '.red, "User does not have 'bulk-create-c' permission"
				statusCode: 403
				body: status: 'error', message: 'You do not have permission to do this'

###
remove rooms any type i.e. channels/private/direct message room
pass room _id in body of data (  data='{"name":[" room _id"]}'  )				
###
Api.addRoute 'bulk/removeGroup', authRequired: true,
	delete:
		# restivus 0.8.4 does not support alanning:roles using groups
		#roleRequired: ['testagent', 'adminautomation']
		action: ->
			# user must also have create-c permission because
			# createChannel method requires it
			if RocketChat.authz.hasPermission(@userId, 'bulk-create-c')
				try
					this.response.setTimeout (1000 * @bodyParams.name.length)
					#Api.testapiValidateRooms @bodyParams.name
					ids = []
					Meteor.runAsUser this.userId, () =>
						(ids[i] = Meteor.call 'eraseRoom', incoming) for incoming,i in @bodyParams.name
					status: 'success', ids: ids  # need to handle error
				catch e
					statusCode: 400    # bad request or other errors
					body: status: 'fail', message: e.name + ' :: ' + e.message
			else
				console.log '[restapi] bulk/removePrivateGroups -> '.red, "User does not have 'bulk-create-c' permission"
				statusCode: 403
				body: status: 'error', message: 'You do not have permission to do this'

# addUser to a channel/private group
Api.addRoute 'addUser', authRequired: true,
	post:
		# restivus 0.8.4 does not support alanning:roles using groups
		#roleRequired: ['testagent', 'adminautomation']
		action: ->
			# user must also have create-c permission because
			# createChannel method requires it
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

###
retrieve a list of integrations
**Note make sure you encode all channel/private rooms  because they start with '#' === '%23' 
Example string ('http://your url here : 3000/api/%23testRoom/roomIntegrations',headers={'X-User-Id':'user_token','X-Auth-Token':'user_token'})
###
Api.addRoute ':channel/roomIntgrations', authRequired: true,
	get: ->
		try
			id = RocketChat.models.Integrations.find({"channel":decodeURIComponent(@urlParams.channel)}).fetch()
			status: 'success', Integrations: id
		catch e 
			statusCode: 400    # bad request or other errors
			body: status: 'Epic fail', message: e.name + ' :: ' + e.message

# retrieve a complete list of all integrations
Api.addRoute 'roomIntegrations', authRequired: true,
	get: ->
		id = RocketChat.models.Integrations.find().fetch()
		status: 'success', Integrations: id				

###
create outgoig webhooks,
creating a push point for messages to be push to from Rocket Chat.
###		
Api.addRoute 'outgoingWebhook', authRequired: true,
	post:
		#roleRequired: ['testagent', 'adminautomation']
		action: ->
			# user must also have create-c permission because
			# createChannel method requires it
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

###
API  '/api/removeOutgoingWebhook'
@apiParam {json} An array of intergration webhooks in the body of the POST. 'integration' is integrations name
use API 'roomIntegrations' method to aquire a list of all webhooks to capture webhook _ids or use ':channel/roomIntgrations' to aquire 
a list from a specfic channel or private room.

@apiParamExample {json} POST Request Body example:
  {
    'integrationId':[ 'integrations_id1','integrations_id2']
  }	
###			
Api.addRoute 'removeOutgoingWebhook', authRequired: true,
	delete:
		#roleRequired: ['testagent', 'adminautomation']
		action: ->
			# user must also have create-c permission 
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

###
Create a direct message room with another user.
pass in the data the user to connect to. (  data='{"username":"Joe"}'    )  connects the user who's header auth creditials are be used.
to connect two users you must issue command as that user. 
###  				
Api.addRoute 'createDirectMessage', authRequired: true,
	post:
		#roleRequired: ['testagent', 'adminautomation']
		action: ->
			# user must also have create-c permission 
			try
				this.response.setTimeout (1000)
				Meteor.runAsUser this.userId, () =>
					Meteor.call 'createDirectMessage', @bodyParams.username
				status: 'success', created : @bodyParams.username
			catch e
				statusCode:400 # bad request
				body: status: 'bad request missing pramas ' + @bodyParams.username, message: e.name + ':: ' + e.message
			
					
					
		