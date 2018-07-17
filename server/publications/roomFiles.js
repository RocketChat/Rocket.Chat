Meteor.publish('roomFiles', function(rid, limit = 50) {
	if (!this.userId) {
		return this.ready();
	}

	const pub = this;

	const cursorFileListHandle = RocketChat.models.Uploads.findNotHiddenFilesOfRoom(rid, limit).observeChanges({
		added(_id, record) {
			const { username, name } = record.userId ? RocketChat.models.Users.findOneById(record.userId) : {};
			return pub.added('room_files', _id, { ...record, user: { username, name } });
		},
		changed(_id, recordChanges) {
			if (!recordChanges.hasOwnProperty('user') && recordChanges.userId) {
				recordChanges.user = RocketChat.models.Users.findOneById(recordChanges.userId);
			}
			return pub.changed('room_files', _id, recordChanges);
		},
		removed(_id) {
			return pub.removed('room_files', _id);
		}
	});

	this.ready();

	return this.onStop(function() {
		return cursorFileListHandle.stop();
	});
});
