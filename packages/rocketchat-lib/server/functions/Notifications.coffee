RocketChat.Notifications = new class
	constructor: ->
		self = @

		@debug = false

		@streamAll = new Meteor.Streamer 'notify-all'
		@streamRoom = new Meteor.Streamer 'notify-room'
		@streamRoomUsers = new Meteor.Streamer 'notify-room-users'
		@streamUser = new Meteor.Streamer 'notify-user'


		@streamAll.allowWrite('none')
		@streamRoom.allowWrite('none')
		@streamRoomUsers.allowWrite (eventName, args...) ->
			[roomId, e] = eventName.split('/')

			user = Meteor.users.findOne @userId, {fields: {username: 1}}
			if RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, @userId)?
				subscriptions = RocketChat.models.Subscriptions.findByRoomIdAndNotUserId(roomId, @userId).fetch()
				for subscription in subscriptions
					RocketChat.Notifications.notifyUser(subscription.u._id, e, args...)

			return false

		@streamUser.allowWrite('logged')

		@streamAll.allowRead('logged')

		@streamRoom.allowRead (eventName) ->
			if not @userId? then return false

			roomId = eventName.split('/')[0]

			user = Meteor.users.findOne @userId, {fields: {username: 1}}
			return RocketChat.models.Rooms.findOneByIdContainigUsername(roomId, user.username, {fields: {_id: 1}})?

		@streamRoomUsers.allowRead('none');

		@streamUser.allowRead (eventName) ->
			userId = eventName.split('/')[0]
			return @userId? and @userId is userId


	notifyAll: (eventName, args...) ->
		console.log 'notifyAll', arguments if @debug is true

		args.unshift eventName
		@streamAll.emit.apply @streamAll, args

	notifyRoom: (room, eventName, args...) ->
		console.log 'notifyRoom', arguments if @debug is true

		args.unshift "#{room}/#{eventName}"
		@streamRoom.emit.apply @streamRoom, args

	notifyUser: (userId, eventName, args...) ->
		console.log 'notifyUser', arguments if @debug is true

		args.unshift "#{userId}/#{eventName}"
		@streamUser.emit.apply @streamUser, args


	notifyAllInThisInstance: (eventName, args...) ->
		console.log 'notifyAll', arguments if @debug is true

		args.unshift eventName
		@streamAll.emitWithoutBroadcast.apply @streamAll, args

	notifyRoomInThisInstance: (room, eventName, args...) ->
		console.log 'notifyRoomAndBroadcast', arguments if @debug is true

		args.unshift "#{room}/#{eventName}"
		@streamRoom.emitWithoutBroadcast.apply @streamRoom, args

	notifyUserInThisInstance: (userId, eventName, args...) ->
		console.log 'notifyUserAndBroadcast', arguments if @debug is true

		args.unshift "#{userId}/#{eventName}"
		@streamUser.emitWithoutBroadcast.apply @streamUser, args


## Permissions for client

# Enable emit for event typing for rooms and add username to event data
func = (eventName, username) ->
	[room, e] = eventName.split('/')

	if e is 'webrtc'
		return true

	if e is 'typing'
		user = Meteor.users.findOne(@userId, {fields: {username: 1}})
		if user?.username is username
			return true

	return false

RocketChat.Notifications.streamRoom.allowWrite func
