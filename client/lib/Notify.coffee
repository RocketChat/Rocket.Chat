@Notify = new class
	constructor: ->
		@debug = true
		@streamAll = new Meteor.Stream 'notify-all'
		@streamRoom = new Meteor.Stream 'notify-room'
		@streamUser = new Meteor.Stream 'notify-user'

		if @debug is true
			@onAll -> console.log "Notify: onAll", arguments
			@onUser -> console.log "Notify: onAll", arguments


	notifyRoom: (room, args...) ->
		console.log "Notify: notifyRoom", arguments if @debug is true

		args = [room].concat args
		@streamRoom.emit.apply @streamRoom, args

	notifyUser: (userId, args...) ->
		console.log "Notify: notifyUser", arguments if @debug is true

		args = [userId].concat args
		@streamUser.emit.apply @streamUser, args


	onAll: (callback) ->
		@streamAll.on 'notify', callback

	onRoom: (room, callback) ->
		console.log 'onRoom'
		if @debug is true
			@streamRoom.on room, -> console.log "Notify: onRoom #{room}", arguments

		@streamRoom.on room, callback

	onUser: (callback) ->
		@streamUser.on Meteor.userId(), callback
