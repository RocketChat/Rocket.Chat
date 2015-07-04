class @msgTyping
	stream = new Meteor.Stream 'typing'
	# store = new Meteor.Collection null
	usersRoomTyping = {}
	stopLimit = 15000
	stopTimeout = null
	renewTime = 10000
	renewTimeout = null

	constructor: (@room) ->
		@renew = true

		# @TODO if usersRoomTyping[@room] already exists, need to clear it
		usersRoomTyping[@room] ?=
			dep: new Tracker.Dependency
			users: {}

		self = @
		stream.on @room, (typing) ->

			clearTimeout usersRoomTyping[self.room].users[typing.username] if usersRoomTyping[self.room].users[typing.username]?

			if typing.start?
				console.log 'typing - iniciou ->',typing.username
				# store.upsert
				# 	room: self.room
				# 	username: typing.username
				# ,
				# 	$set:
				# 		ts: new Date()

				if not usersRoomTyping[self.room].users[typing.username]?
					newUser = true

				usersRoomTyping[self.room].users[typing.username] = Meteor.setTimeout ->
					console.log 'typing - removido (inatividade) ->',typing.username

					delete usersRoomTyping[self.room].users[typing.username]
					usersRoomTyping[self.room].dep.changed()

					# store.remove
					# 	room: self.room
					# 	username: typing.username
				, stopLimit

				usersRoomTyping[self.room].dep.changed() if newUser

			else if typing.stop?
				console.log 'typing - removido (forçado) ->',typing.username
				delete usersRoomTyping[self.room].users[typing.username]
				usersRoomTyping[self.room].dep.changed()
				# store.remove
				# 	room: self.room
				# 	username: typing.username

	type: ->

		# clearTimeout stopTimeout if stopTimeout?

		# stopTimeout = Meteor.setTimeout ->
		# 	console.log 'typing - parando ->',Meteor.user().username
		# 	stream.emit 'typing', { room: @room, username: Meteor.user().username, stop: true }
		# , renewTime

		console.log 'renew ->',@renew

		return unless @renew

		self = @

		clearTimeout renewTimeout if renewTimeout?

		renewTimeout = Meteor.setTimeout ->
			console.log 'typing - começa de novo ->',Meteor.user().username
			self.renew = true
		, renewTime

		@renew = false

		console.log 'typing - iniciando ->',Meteor.user().username

		stream.emit 'typing', { room: @room, username: Meteor.user().username, start: true }

	get: ->
		usersRoomTyping[@room].dep.depend()
		return Object.keys usersRoomTyping[@room].users
		# console.log 'find by ->',room: @room, store.find().fetch()
		# return store.find room: @room
