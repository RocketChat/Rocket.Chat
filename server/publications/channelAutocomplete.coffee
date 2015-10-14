Meteor.publish 'channelAutocomplete', (name) ->
	unless this.userId
		return this.ready()

	console.log '[publish] channelAutocomplete -> '.green, name

	pub = this

	options =
		fields:
			_id: 1
			name: 1
		limit: 5

	cursorHandle = RocketChat.models.Rooms.findByNameContainingAndTypes(name, ['c'], options).observeChanges
        added: (_id, record) ->
			pub.added('channel-autocomplete', _id, record) if _id?
		changed: (_id, record) ->
			pub.changed('channel-autocomplete', _id, record) if _id?
		removed: (_id, record) ->
			pub.removed('channel-autocomplete', _id, record) if _id?
	@ready()
	@onStop ->
		cursorHandle.stop()
	return
