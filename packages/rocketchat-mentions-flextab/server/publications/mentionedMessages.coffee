Meteor.publish 'mentionedMessages', (rid, options = {}) ->
	unless this.userId
		return this.ready()

	console.log '[publish] mentionedMessages -> '.green, 'rid:', rid, 'options:', options

	publication = @

	user = RocketChat.models.Users.findOneById this.userId
	unless user
		return this.ready()

	cursorHandle = RocketChat.models.Messages.findByMentionAndRoomId(user.username, rid, { sort: { ts: -1 }, limit: 50 }).observeChanges
		added: (_id, record) ->
			record.mentionedList = true
			publication.added('rocketchat_mentioned_message', _id, record)

		changed: (_id, record) ->
			record.mentionedList = true
			publication.changed('rocketchat_mentioned_message', _id, record)

		removed: (_id) ->
			publication.removed('rocketchat_mentioned_message', _id)

	@ready()
	@onStop ->
		cursorHandle.stop()
