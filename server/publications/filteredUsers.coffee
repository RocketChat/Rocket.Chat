Meteor.publish 'filteredUsers', (filter) ->
	unless this.userId
		return this.ready()

	if not _.isObject filter
		return this.ready()

	exp = new RegExp(s.escapeRegExp(filter.name), 'i')

	options =
		fields:
			username: 1
		sort:
			username: 1
		limit: 5

	pub = this

	cursorHandle = RocketChat.models.Users.findByActiveUsersUsernameExcept(exp, filter.except, options).observeChanges
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
