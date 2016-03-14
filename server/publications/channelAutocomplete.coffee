Meteor.publish 'channelAutocomplete', (name) ->
	if not this.userId and RocketChat.settings.get("Accounts_AnonymousAccess") is 'None'
		return this.ready()

	pub = this

	options =
		fields:
			_id: 1
			name: 1
		limit: 5
		sort:
			name: 1

	cursorHandle = RocketChat.models.Rooms.findByNameContainingAndTypes(name, ['c'], options).observeChanges
		added: (_id, record) ->
			pub.added('channel-autocomplete', _id, record)
		changed: (_id, record) ->
			pub.changed('channel-autocomplete', _id, record)
		removed: (_id, record) ->
			pub.removed('channel-autocomplete', _id, record)
	@ready()
	@onStop ->
		cursorHandle.stop()
	return
