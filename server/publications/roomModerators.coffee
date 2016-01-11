Meteor.publish 'roomModerators', (rid, limit = 50) ->
	unless this.userId
		return this.ready()

	pub = this

	query =
		rid: rid
		roles: 'moderator'

	options =
		limit: limit
		sort:
			"u.username": 1
		fields:
			rid: 1
			u: 1

	cursor = RocketChat.models.Subscriptions.find(query, options).observeChanges
		added: (_id, record) ->
			pub.added('room_moderators', _id, record)

		changed: (_id, record) ->
			pub.changed('room_moderators', _id, record)

		removed: (_id, record) ->
			pub.removed('room_moderators', _id, record)

	this.ready()
	this.onStop ->
		cursor.stop()

