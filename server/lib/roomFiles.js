import { Meteor } from 'meteor/meteor';
import { Users, Uploads } from 'meteor/rocketchat:models';

export const roomFiles = (pub, { rid, searchText, limit = 50 }) => {
	if (!pub.userId) {
		return pub.ready();
	}

	if (!Meteor.call('canAccessRoom', rid, pub.userId)) {
		return this.ready();
	}

	const cursorFileListHandle = Uploads.findNotHiddenFilesOfRoom(rid, searchText, limit).observeChanges({
		added(_id, record) {
			const { username, name } = record.userId ? Users.findOneById(record.userId) : {};
			return pub.added('room_files', _id, { ...record, user: { username, name } });
		},
		changed(_id, recordChanges) {
			if (!recordChanges.hasOwnProperty('user') && recordChanges.userId) {
				recordChanges.user = Users.findOneById(recordChanges.userId);
			}
			return pub.changed('room_files', _id, recordChanges);
		},
		removed(_id) {
			return pub.removed('room_files', _id);
		},
	});

	pub.ready();

	return pub.onStop(function() {
		return cursorFileListHandle.stop();
	});
};
