RocketChat.Notifications = new class
	constructor: ->
		self = @

		@debug = true

		@streamAll = new Meteor.Stream 'notify-all'
		@streamRoom = new Meteor.Stream 'notify-room'
		@streamUser = new Meteor.Stream 'notify-user'


		@streamAll.permissions.write -> return @userId?
		@streamAll.permissions.read -> return @userId?

		@streamRoom.permissions.write -> return @userId?
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
