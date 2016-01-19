Meteor.publish 'adminRooms', (filter, types, limit) ->
	unless this.userId
		return this.ready()

	if RocketChat.authz.hasPermission(@userId, 'view-room-administration') isnt true
		return this.ready()

	unless _.isArray types
		types = []

	options =
		fields:
			name: 1
			t: 1
			cl: 1
			u: 1
			usernames: 1
			muted: 1
		limit: limit
		sort:
			name: 1

	filter = _.trim filter

	if filter and types.length
		return RocketChat.models.Rooms.findByNameContainingAndTypes filter, types, options

	if filter
		return RocketChat.models.Rooms.findByNameContaining filter, options

	if types.length
		return RocketChat.models.Rooms.findByTypes types, options
