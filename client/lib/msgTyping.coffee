@MsgTyping = do ->
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
			RocketChat.Notifications.onRoom room, 'typing', (username, typing) ->
				unless username is Meteor.user()?.username
					if typing is true
						users = usersTyping[room].users
						users[username] = Meteor.setTimeout ->
							delete users[username]
							usersTyping[room].users = users
							dep.changed()
						, timeout
						usersTyping[room].users = users
						dep.changed()
					else
						users = usersTyping[room].users
						delete users[username]
						usersTyping[room].users = users
						dep.changed()

	Tracker.autorun ->
		if Session.get 'openedRoom'
			addStream Session.get 'openedRoom'

	start = (room) ->
		return unless renew

		setTimeout ->
			renew = true
		, renewTimeout

		renew = false
		selfTyping.set true
		RocketChat.Notifications.notifyRoom room, 'typing', Meteor.user()?.username, true
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
		RocketChat.Notifications.notifyRoom room, 'typing', Meteor.user()?.username, false

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
