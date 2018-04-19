Meteor.publish('roomFiles', function(rid, limit = 50) {
	if (!this.userId) {
		return this.ready();
	}

	const pub = this;

	const cursorFileListHandle = RocketChat.models.Uploads.findNotHiddenFilesOfRoom(rid, limit).observeChanges({
		added(_id, record) {
			const {username, name} = RocketChat.models.Users.findOneById(record.userId);
			return pub.added('room_files', _id, {...record, user:{username, name}});
		},
		changed(_id, record) {
			const {username, name} = RocketChat.models.Users.findOneById(record.userId);
			return pub.changed('room_files', _id, {...record, user:{username, name}});
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
