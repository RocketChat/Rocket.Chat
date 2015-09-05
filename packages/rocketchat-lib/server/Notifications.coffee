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
		@streamRoom.permissions.read (event) ->
			if not @userId? then return false

			if event is 'notify' then return true

			user = Meteor.users.findOne @userId, {fields: {username: 1}}
			return ChatRoom.findOne({_id: event, usernames: user.username}, {fields: {_id: 1}})?

		@streamUser.permissions.write -> return @userId?
		@streamUser.permissions.read (event) ->
			if not @userId? then return false

			return event is 'notify' or event is @userId


	notifyAll: (args...) ->
		console.log 'notifyAll', arguments if @debug is true

		args.unshift 'notify'
		@streamAll.emit.apply @streamAll, args

	notifyRoom: (room, args...) ->
		console.log 'notifyRoom', arguments if @debug is true

		args.unshift room
		@streamRoom.emit.apply @streamRoom, args

	notifyUser: (userId, args...) ->
		console.log 'notifyUser', arguments if @debug is true

		args.unshift userId
		@streamUser.emit.apply @streamUser, args
