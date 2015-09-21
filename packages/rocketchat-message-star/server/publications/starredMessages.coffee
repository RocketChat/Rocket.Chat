Meteor.publish 'starredMessages', (rid, options = {}) ->
	unless this.userId
		return this.ready()

	console.log '[publish] starredMessages -> '.green, 'rid:', rid, 'options:', options

	publication = @

	cursorHandle = ChatMessage.find({ 'starred._id': this.userId, rid: rid, _hidden: { $ne: true } }, { sort: { ts: -1 }, limit: 50 }).observeChanges
		added: (_id, record) ->
			publication.added('rocketchat_starred_message', _id, record)

		changed: (_id, record) ->
			publication.changed('rocketchat_starred_message', _id, record)

	@ready()
	@onStop ->
		cursorHandle.stop()
