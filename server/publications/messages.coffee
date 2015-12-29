Meteor.publish 'messages', (rid, start) ->
	unless this.userId
		return this.ready()

	publication = this

	if typeof rid isnt 'string'
		return this.ready()

	if not Meteor.call 'canAccessRoom', rid, this.userId
		return this.ready()

	cursor = RocketChat.models.Messages.findVisibleByRoomId rid,
		sort:
			ts: -1
		limit: 50

	cursorHandle = cursor.observeChanges
		added: (_id, record) ->
			record.starred = _.findWhere record.starred, { _id: publication.userId }
			publication.added('rocketchat_message', _id, record)

		changed: (_id, record) ->
			record.starred = _.findWhere record.starred, { _id: publication.userId }
			publication.changed('rocketchat_message', _id, record)

	cursorDelete = RocketChat.models.Messages.findInvisibleByRoomId rid,
		fields:
			_id: 1

	cursorDeleteHandle = cursorDelete.observeChanges
		added: (_id, record) ->
			publication.added('rocketchat_message', _id, {_hidden: true})
		changed: (_id, record) ->
			publication.added('rocketchat_message', _id, {_hidden: true})

	@ready()
	@onStop ->
		cursorHandle.stop()
		cursorDeleteHandle.stop()
