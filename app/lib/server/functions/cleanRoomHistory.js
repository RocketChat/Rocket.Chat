import { deleteRoom } from './deleteRoom';
import { FileUpload } from '../../../file-upload';
import { Rooms, RoomEvents } from '../../../models';
import { Notifications } from '../../../notifications';

export const cleanRoomHistory = function({ rid, latest = new Date(), oldest = new Date('0001-01-01T00:00:00Z'), inclusive = true, limit = 0, excludePinned = true, ignoreDiscussion = true, filesOnly = false, fromUsers = [], ignoreThreads = true }) {
	const gt = inclusive ? '$gte' : '$gt';
	const lt = inclusive ? '$lte' : '$lt';

	const query = queryBuilder({
		rid,
		ts: { [gt]: oldest, [lt]: latest },
		excludePinned,
		fromUsers,
		ignoreThreads,
		{ fields: { 'file._id': 1, pinned: 1 }, limit },
	).forEach((document) => {
		FileUpload.getStore('Uploads').deleteById(document.file._id);
		fileCount++;
		if (filesOnly) {
			Messages.update({ _id: document._id }, { $unset: { file: 1 }, $set: { attachments: [{ color: '#FD745E', text }] } });
		}
	});

	if (filesOnly) {
		return fileCount;
	}

	if (!ignoreDiscussion) {
		Messages.findDiscussionByRoomIdPinnedTimestampAndUsers(rid, excludePinned, ts, fromUsers, { fields: { drid: 1 }, ...limit && { limit } }, ignoreThreads).fetch()
			.forEach(({ drid }) => deleteRoom(drid));
	}

	if (result.count) {
		Rooms.resetLastMessageById(rid);
		Notifications.notifyRoom(rid, 'deleteMessageBulk', {
			rid,
			excludePinned,
			ignoreDiscussion,
			ts: query.ts,
			users: fromUsers,
		});
	}
	return result.count;
};
