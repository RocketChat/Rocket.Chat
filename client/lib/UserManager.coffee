@UserManager = new class
	users = {}

	dep = new Tracker.Dependency

	addUser = (usernames) ->
		# console.log 'addUser', usernames if window.rocketUserDebug
		usernames = [].concat usernames
		for username in usernames
			unless users[username]
				users[username] = 1
				dep.changed()

	subscribeFn = ->
		return true
		# Meteor.subscribe 'selectiveUsers', users

	subscribe = new DelayedTask subscribeFn, 100, 1000

	init = ->
		Tracker.autorun ->
			dep.depend()
			subscribe.run()

	# init()

	addUser: addUser
	users: users
