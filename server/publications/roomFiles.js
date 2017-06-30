Meteor.publish('roomFiles', function(rid, limit = 50) {
	if (!this.userId) {
		return this.ready();
	}

	const pub = this;

	const cursorFileListHandle = RocketChat.models.Uploads.findNotHiddenFilesOfRoom(rid, limit).observeChanges({
		added(_id, record) {
			return pub.added('room_files', _id, record);
		},
		changed(_id, record) {
			return pub.changed('room_files', _id, record);
		},
		removed(_id, record) {
			return pub.removed('room_files', _id, record);
		}
	});

	this.ready();

	return this.onStop(function() {
		return cursorFileListHandle.stop();
	});
});
