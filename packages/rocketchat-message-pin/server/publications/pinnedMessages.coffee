Meteor.publish 'pinnedMessages', (rid, limit=50) ->
	if not this.userId and RocketChat.settings.get("Accounts_AnonymousAccess") is 'None'
		return this.ready()

	publication = @

	cursorHandle = RocketChat.models.Messages.findPinnedByRoom(rid, { sort: { ts: -1 }, limit: limit }).observeChanges
		added: (_id, record) ->
			publication.added('rocketchat_pinned_message', _id, record)

		changed: (_id, record) ->
			publication.changed('rocketchat_pinned_message', _id, record)

		removed: (_id) ->
			publication.removed('rocketchat_pinned_message', _id)

	@ready()
	@onStop ->
		cursorHandle.stop()
