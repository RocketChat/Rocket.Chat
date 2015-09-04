@NotifyClient = new class
	constructor: ->
		self = @

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


		@streamRoom.on 'notify', self.notifyRoom.bind(@)
		@streamUser.on 'notify', self.notifyUser.bind(@)

	notifyAll: (data) ->
		@streamAll.emit 'notify', data

	notifyRoom: (room, data) ->
		@streamRoom.emit room, data

	notifyUser: (userId, data) ->
		@streamUser.emit userId, data
