Api = new Restivus
	useDefaultAuth: true
	prettyJson: true


Api.addCollection ChatMessage
Api.addCollection ChatRoom


Api.addRoute 'version', authRequired: false,
	get: ->
		version = {api: '0.1', rocketchat: '0.5'}
		status: 'success', versions: version

Api.addRoute 'publicRooms', authRequired: true,
	get: ->
		rooms = ChatRoom.find({ t: 'c' }, { sort: { msgs:-1 } }).fetch()
		if rooms
			status: 'success', rooms: rooms
		else
			statusCode: 404
			body: status: 'fail', message: 'Rooms not found'

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
		msgs = ChatMessage.find({rid: @urlParams.id, _deleted: {$ne: true}}, {sort: {ts: -1}}, {limit: 50}).fetch()

		if msgs
			status: 'success', messages: msgs
		else
			statusCode: 404
			body: status: 'fail', message: 'Messages not found'


# send a message in a room -  POST body should be { "msg" : "this is my message"}
Api.addRoute 'rooms/:id/send', authRequired: true,
	post: ->
		Meteor.runAsUser this.userId, () =>
			console.log @bodyParams.msg
			Meteor.call('sendMessage', {msg: this.bodyParams.msg, rid: @urlParams.id} )
		status: 'success'	#need to handle error

