import { TAPi18n } from 'meteor/tap:i18n';
import { FileUpload } from 'meteor/rocketchat:file-upload';

RocketChat.cleanRoomHistory = function({ rid, latest = new Date(), oldest = new Date('0001-01-01T00:00:00Z'), inclusive = true, limit = 0, excludePinned = true, filesOnly = false, fromUsers = [] }) {
	const gt = inclusive ? '$gte' : '$gt';
	const lt = inclusive ? '$lte' : '$lt';

	const ts = { [gt]: oldest, [lt]: latest };

	const text = `_${ TAPi18n.__('File_removed_by_prune') }_`;

	let fileCount = 0;
	RocketChat.models.Messages.findFilesByRoomIdPinnedTimestampAndUsers(
		rid,
		excludePinned,
		ts,
		fromUsers,
		{ fields: { 'file._id': 1, pinned: 1 }, limit }
	).forEach((document) => {
		FileUpload.getStore('Uploads').deleteById(document.file._id);
		fileCount++;
		if (filesOnly) {
			RocketChat.models.Messages.update({ _id: document._id }, { $unset: { file: 1 }, $set: { attachments: [{ color: '#FD745E', text }] } });
		}
	});
	if (filesOnly) {
		return fileCount;
	}

	const count = limit ? RocketChat.models.Messages.removeByIdPinnedTimestampLimitAndUsers(rid, excludePinned, ts, limit, fromUsers) : RocketChat.models.Messages.removeByIdPinnedTimestampAndUsers(rid, excludePinned, ts, fromUsers);

	if (count) {
		RocketChat.models.Rooms.resetLastMessageById(rid);
		RocketChat.Notifications.notifyRoom(rid, 'deleteMessageBulk', {
			rid,
			excludePinned,
			ts,
			users: fromUsers,
		});
	}
	return count;
};
