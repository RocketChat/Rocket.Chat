@Notify = new class
	constructor: ->
		@streamAll = new Meteor.Stream 'notify-all'
		@streamRoom = new Meteor.Stream 'notify-room'
		@streamUser = new Meteor.Stream 'notify-user'

		@streamAll.on 'notify', @onAll
		# @stream.on room, @onRoom
		@streamUser.on Meteor.userId(), @onUser

	listenRoom: (room) ->
		@streamRoom.on room, @onRoom

	notifyAll: (data) ->
		@streamAll.emit 'notify', data

	notifyRoom: (room, data) ->
		@streamRoom.emit 'notify', room, data

	notifyUser: (userId, data) ->
		@streamUser.emit 'notify', userId, data

	onAll: (data) ->
		console.log 'onAll', data

	onRoom: (data) ->
		console.log 'onRoom', data

	onUser: (data) ->
		console.log 'onUser', data