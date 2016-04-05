Meteor.publish 'channelAndPrivateAutocomplete', (selector) ->
	unless this.userId
		return this.ready()

	if RocketChat.authz.hasPermission( @userId, 'view-other-user-channels') isnt true
		return this.ready()

	pub = this

	options =
		fields:
			_id: 1
			name: 1
		limit: 10
		sort:
			name: 1

	cursorHandle = RocketChat.models.Rooms.findByNameStartingAndTypes(selector.name, ['c', 'p'], options).observeChanges
		added: (_id, record) ->
			pub.added('autocompleteRecords', _id, record)
		changed: (_id, record) ->
			pub.changed('autocompleteRecords', _id, record)
		removed: (_id, record) ->
			pub.removed('autocompleteRecords', _id, record)
	@ready()
	@onStop ->
		cursorHandle.stop()
	return
