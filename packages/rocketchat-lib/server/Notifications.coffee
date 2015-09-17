RocketChat.Notifications = new class
	constructor: ->
		self = @

		@debug = false

		@streamAll = new Meteor.Stream 'notify-all'
		@streamRoom = new Meteor.Stream 'notify-room'
		@streamUser = new Meteor.Stream 'notify-user'


		@streamAll.permissions.write -> return false
		@streamAll.permissions.read -> return @userId?

		@streamRoom.permissions.write -> return false
		@streamRoom.permissions.read (eventName) ->
			if not @userId? then return false

			roomId = eventName.split('/')[0]

			user = Meteor.users.findOne @userId, {fields: {username: 1}}
			return ChatRoom.findOne({_id: roomId, usernames: user.username}, {fields: {_id: 1}})?

		@streamUser.permissions.write -> return @userId?
		@streamUser.permissions.read (eventName) ->
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



## Permissions for client

# Enable emit for event typing for rooms and add username to event data
func = (eventName, username, typing) ->
	console.log arguments
	[room, e] = eventName.split('/')

	if e isnt 'typing'
		return false

	user = Meteor.users.findOne(@userId, {fields: {username: 1}})
	if not user? or user.username isnt username
		return false

	return true

RocketChat.Notifications.streamRoom.permissions.write func, false # Prevent Cache
