Meteor.publish 'filteredUsers', (name) ->
	unless this.userId
		return this.ready()

	console.log '[publish] filteredUsers'.green, name

	exp = new RegExp(name, 'i')

	query =
		username:
			$exists: 1

		$or: [
			{name: exp}
			{username: exp}
		]

	options =
		fields:
			username: 1
			name: 1
			status: 1
			utcOffset: 1
		sort:
			lastLogin: -1
		limit: 5

	pub = this

	cursorHandle = Meteor.users.find(query, options).observeChanges
		added: (_id, record) ->
			pub.added('filtered-users', _id, record)

		changed: (_id, record) ->
			pub.changed('filtered-users', _id, record)

		removed: (_id, record) ->
			pub.removed('filtered-users', _id, record)

	@ready()
	@onStop ->
		cursorHandle.stop()
	return
