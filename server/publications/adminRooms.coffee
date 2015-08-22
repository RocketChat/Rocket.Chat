Meteor.publish 'adminRooms', (filter, types, limit) ->
	unless this.userId
		return this.ready()

	user = Meteor.users.findOne this.userId
	if user.admin isnt true
		return this.ready()

	unless _.isArray types
		types = []

	query = {}
	
	filter = _.trim filter
	if filter
		if limit is 1
			query = { name: filter }
		else
			filterReg = new RegExp filter, "i"
			query = { $or: [ { name: filterReg }, { t: 'd', usernames: filterReg } ] }
	
	if types.length
		query['t'] = { $in: types }

	console.log '[publish] adminRooms'.green, filter, types, limit, query

	ChatRoom.find query,
		fields:
			name: 1
			t: 1
			cl: 1
			u: 1
			usernames: 1
		limit: limit
		sort: { name: 1 }
