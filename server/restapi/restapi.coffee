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

Api.addRoute 'publicRooms', authRequired: true,
	get: ->
		rooms = RocketChat.models.Rooms.findByType('c', { sort: { msgs:-1 } }).fetch()
		status: 'success', rooms: rooms

# join a room
Api.addRoute 'rooms/:id/join', authRequired: true,
	post: ->
		Meteor.runAsUser this.userId, () =>
			Meteor.call('joinRoom', @urlParams.id)
		status: 'success'   # need to handle error

# leave a room
Api.addRoute 'rooms/:id/leave', authRequired: true,
	post: ->
		Meteor.runAsUser this.userId, () =>
			Meteor.call('leaveRoom', @urlParams.id)
		status: 'success'   # need to handle error


# get messages in a room
Api.addRoute 'rooms/:id/messages', authRequired: true,
	get: ->
		try
			if Meteor.call('canAccessRoom', @urlParams.id, this.userId)
				msgs = RocketChat.models.Messages.findVisibleByRoomId(@urlParams.id, {sort: {ts: -1}, limit: 50}).fetch()
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



