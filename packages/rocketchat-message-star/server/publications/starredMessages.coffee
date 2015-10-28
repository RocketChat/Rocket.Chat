Meteor.publish 'starredMessages', (rid, options = {}) ->
	unless this.userId
		return this.ready()

	console.log '[publish] starredMessages -> '.green, 'rid:', rid, 'options:', options

	publication = @

	cursorHandle = RocketChat.models.Messages.findStarredByUserAtRoom(this.userId, rid, { sort: { ts: -1 }, limit: 50 }).observeChanges
		added: (_id, record) ->
			publication.added('rocketchat_starred_message', _id, record)

		changed: (_id, record) ->
			publication.changed('rocketchat_starred_message', _id, record)

		removed: (_id) ->
			publication.removed('rocketchat_starred_message', _id)

	@ready()
	@onStop ->
		cursorHandle.stop()
