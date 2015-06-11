Meteor.publish 'selectiveUsers', (usernames) ->
	unless this.userId
		return this.ready()

	console.log '[publish] selectiveUsers -> '.green, 'userIds:', userIds

	self = this

	query =
		username: $exists: true

	options =
		fields:
			name: 1
			username: 1
			status: 1

	cursor = Meteor.users.find query, options

	observer = cursor.observeChanges
		added: (id, record) ->
			if usernames[record.username]?
				self.added 'users', id, record
		changed: (id, record) ->
			if usernames[record.username]?
				self.changed 'users', id, record
		removed: (id) ->
			if usernames[record.username]?
				self.removed 'users', id

	this.ready()
	this.onStop ->
		observer.stop()

