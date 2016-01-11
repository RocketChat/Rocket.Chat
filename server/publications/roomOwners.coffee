Meteor.publish 'roomOwners', (rid, limit = 50) ->
	unless this.userId
		return this.ready()

	pub = this

	query =
		rid: rid
		roles: 'owner'

	options =
		limit: limit
		sort:
			"u.username": 1
		fields:
			u: 1

	cursor = RocketChat.models.Subscriptions.find(query, options).observeChanges
		added: (_id, record) ->
			pub.added('room_owners', _id, record)

		changed: (_id, record) ->
			pub.changed('room_owners', _id, record)

		removed: (_id, record) ->
			pub.removed('room_owners', _id, record)

	this.ready()
	this.onStop ->
		cursor.stop()

