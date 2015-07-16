@MsgTyping = do ->
	stream = new Meteor.Stream 'typing'
	timeout = 15000
	timeouts = {}
	renew = true
	renewTimeout = 10000
	selfTyping = new ReactiveVar false
	usersTyping = {}

	addStream = (room) ->
		unless usersTyping[room]?
			usersTyping[room] = { users: new ReactiveVar {} }
			stream.on room, (typing) ->
				unless typing.username is Meteor.user()?.username
					if typing.start
						users = usersTyping[room].users.get()
						users[typing.username] = Meteor.setTimeout ->
							delete users[typing.username]
							usersTyping[room].users.set users
						, timeout
						usersTyping[room].users.set users
					else if typing.stop
						users = usersTyping[room].users.get()
						delete users[typing.username]
						usersTyping[room].users.set users

	Tracker.autorun ->
		addStream Session.get 'openedRoom'

	start = (room) ->
		return unless renew

		setTimeout ->
			renew = true
		, renewTimeout

		renew = false
		selfTyping.set true
		stream.emit 'typing', { room: room, username: Meteor.user().username, start: true }
		clearTimeout timeouts[room]
		timeouts[room] = Meteor.setTimeout ->
			stop(room)
		, timeout

	stop = (room) ->
		renew = true
		selfTyping.set false
		if timeouts?[room]?
			clearTimeout(timeouts[room]) 
			timeouts[room] = null
		stream.emit 'typing', { room: room, username: Meteor.user().username, stop: true }
		
	get = (room) ->
		if usersTyping[room]?
			users = usersTyping[room].users.get()
			return _.keys(users) or []
		return []

	return { 
		start: start
		stop: stop
		get: get
		selfTyping: selfTyping
	}