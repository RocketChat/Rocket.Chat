@MsgTyping = do ->
	stream = new Meteor.Streamer 'typing'
	timeout = 15000
	timeouts = {}
	renew = true
	renewTimeout = 10000
	selfTyping = new ReactiveVar false
	usersTyping = {}
	dep = new Tracker.Dependency

	addStream = (room) ->
		if _.isEmpty usersTyping[room]?.users
			usersTyping[room] = { users: {} }
			stream.on room, (typing) ->
				unless typing?.username is Meteor.user()?.username
					if typing.start
						users = usersTyping[room].users
						users[typing.username] = Meteor.setTimeout ->
							delete users[typing.username]
							usersTyping[room].users = users
							dep.changed()
						, timeout
						usersTyping[room].users = users
						dep.changed()
					else if typing.stop
						users = usersTyping[room].users
						delete users[typing.username]
						usersTyping[room].users = users
						dep.changed()

	Tracker.autorun ->
		if visitor.getRoom()
			addStream visitor.getRoom()

	start = (room) ->
		return unless renew

		setTimeout ->
			renew = true
		, renewTimeout

		renew = false
		selfTyping.set true
		stream.emit 'typing', { room: room, username: Meteor.user()?.username, start: true }
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
		stream.emit 'typing', { room: room, username: Meteor.user()?.username, stop: true }

	get = (room) ->
		dep.depend()
		unless usersTyping[room]
			usersTyping[room] = { users: {} }
		users = usersTyping[room].users
		return _.keys(users) or []

	return {
		start: start
		stop: stop
		get: get
		selfTyping: selfTyping
	}
