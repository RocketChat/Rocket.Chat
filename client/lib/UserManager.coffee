@UserManager = new class
	users = {}

	dep = new Tracker.Dependency

	addUser = (userIds) ->
		# console.log 'addUser', userIds if window.rocketUserDebug
		userIds = [].concat userIds
		for userId in userIds
			unless users[userId]
				users[userId] = 1
				dep.changed()

	subscribeFn = ->
		Meteor.subscribe 'selectiveUsers', users

	subscribe = new DelayedTask subscribeFn, 100, 1000

	init = ->
		Tracker.autorun ->
			dep.depend()
			subscribe.run()

	init()

	addUser: addUser
	users: users
