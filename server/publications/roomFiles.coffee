Meteor.publish 'roomFiles', (rid, limit = 50) ->
	unless this.userId
		return this.ready()

	pub = this

	cursorFileListHandle = RocketChat.models.Uploads.findNotHiddenFilesOfRoom(rid, limit).observeChanges
		added: (_id, record) ->
			pub.added('room_files', _id, record)

		changed: (_id, record) ->
			pub.changed('room_files', _id, record)

		removed: (_id, record) ->
			pub.removed('room_files', _id, record)

	this.ready()
	this.onStop ->
		cursorFileListHandle.stop()
