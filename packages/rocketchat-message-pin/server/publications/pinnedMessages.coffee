Meteor.publish 'pinnedMessages', (rid, options = {}) ->
	unless this.userId
		return this.ready()

	console.log '[publish] pinnedMessages -> '.green, 'rid:', rid, 'options:', options

	publication = @

	cursorHandle = RocketChat.models.Messages.findPinnedByRoom(rid, { sort: { ts: -1 }, limit: 50 }).observeChanges
		added: (_id, record) ->
			publication.added('rocketchat_pinned_message', _id, record)

		changed: (_id, record) ->
			publication.changed('rocketchat_pinned_message', _id, record)

		removed: (_id) ->
			publication.removed('rocketchat_pinned_message', _id)

	@ready()
	@onStop ->
		cursorHandle.stop()
