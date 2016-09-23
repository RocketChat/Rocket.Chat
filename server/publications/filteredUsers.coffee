Meteor.publish 'filteredUsers', (selector) ->
	unless this.userId
		return this.ready()

	if not _.isObject selector
		return this.ready()

	options =
		fields:
			name: 1
			username: 1

		sort:
			username: 1
		limit: 5

	pub = this

	exceptions = selector.except or []

	cursorHandle = RocketChat.models.Users.findByActiveUsersUsernameExcept(selector.name, exceptions, options).observeChanges
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
