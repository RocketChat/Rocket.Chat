Meteor.publish 'messages', (rid, start) ->
	unless this.userId
		return this.ready()

	publication = this

	console.log '[publish] messages ->'.green, 'rid:', rid, 'start:', start

	if typeof rid isnt 'string'
		return this.ready()

	if not Meteor.call 'canAccessRoom', rid, this.userId
		return this.ready()

	cursor = ChatMessage.find
		rid: rid
		_hidden:
			$ne: true
	,
		sort:
			ts: -1
		limit: 50

	cursorHandle = cursor.observeChanges
		added: (_id, record) ->
			publication.added('rocketchat_message', _id, record)

		changed: (_id, record) ->
			publication.changed('rocketchat_message', _id, record)

	cursorDelete = ChatMessage.find
		rid: rid
		_hidden: true
	,
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
