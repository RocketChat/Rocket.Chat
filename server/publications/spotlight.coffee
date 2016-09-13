Meteor.methods
	spotlight: (text, username) ->
		if not this.userId?
			return {
				users: []
				rooms: []
			}

		regex = new RegExp s.trim(s.escapeRegExp(text)), "i"

		users = RocketChat.models.Users.findByUsername(regex, { limit: 5, fields: { username: 1, status: 1 }, sort: { username: 1 } }).fetch()

		rooms = RocketChat.models.Rooms.findByNameAndTypeNotContainingUsername(regex, 'c', username, { limit: 5, fields: { t: 1, name: 1 }, sort: { name: 1 } }).fetch()

		return {
			users: users
			rooms: rooms
		}

DDPRateLimiter.addRule
	type: 'method'
	name: 'spotlight'
	userId: (userId) ->
		return true
, 10, 10000
