Meteor.methods
	spotlight: (text, username) ->
		result =
				users: []
				rooms: []

		if not this.userId?
			return result

		regex = new RegExp s.trim(s.escapeRegExp(text)), "i"

		if RocketChat.authz.hasPermission this.userId, 'view-d-room'
			result.users = RocketChat.cache.Users.findByUsername(regex, { limit: 5, fields: { username: 1, status: 1 }, sort: { username: 1 } }).fetch()

		if RocketChat.authz.hasPermission this.userId, 'view-c-room'
			result.rooms = RocketChat.cache.Rooms.findByNameAndTypeNotContainingUsername(regex, 'c', username, { limit: 5, fields: { t: 1, name: 1 }, sort: { name: 1 } }).fetch()

		return result

DDPRateLimiter.addRule
	type: 'method'
	name: 'spotlight'
	userId: (userId) ->
		return true
, 10, 10000
