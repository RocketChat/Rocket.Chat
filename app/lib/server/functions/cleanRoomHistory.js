import { deleteRoom } from './deleteRoom';
import { FileUpload } from '../../../file-upload';
import { Rooms, RoomEvents } from '../../../models';
import { Notifications } from '../../../notifications';

function queryBuilder({ rid, ts, excludePinned, fromUsers, filesOnly, ignoreDiscussion }) {
	const query = {
		rid: { $eq: rid },
		t: { $eq: 'msg' },
		'd.t': { $in: ['msg'] },
		ts,
		'd.u.username': { $exists: true }, // this changes below if necessary
		_deletedAt: { $exists: false }, // since we don't need something is already deleted
	};
	if (!excludePinned) {
		query['d.t'].$in.push('message_pinned');
	} else {
		query['d.pinned'] = { $exists: false };
	}

	// change first defined users value in case there are a fromUsers option selected
	if (fromUsers && fromUsers.length) {
		query['d.u.username'] = { $in: fromUsers };
	}

	if (filesOnly) {
		query['d.file._id'] = { $exists: 1 };
	}

	if (!ignoreDiscussion) {
		query['d.t'].$in.push('discussion-created');
	}

	return query;
}

export const cleanRoomHistory = async function({ rid, latest = new Date(), oldest = new Date('0001-01-01T00:00:00Z'), inclusive = true, excludePinned = true, ignoreDiscussion = true, filesOnly = false, fromUsers = [] }) {
	const gt = inclusive ? '$gte' : '$gt';
	const lt = inclusive ? '$lte' : '$lt';

	const query = queryBuilder({
		rid,
		ts: { [gt]: oldest, [lt]: latest },
		excludePinned,
		fromUsers,
		filesOnly,
		ignoreDiscussion,
	});

	const result = await RoomEvents.createPruneMessagesEvent(query, rid);

	// deleting files from storage
	for (let f = 0; result.filesIds.length > f; f++) {
		FileUpload.getStore('Uploads').deleteById(result.filesIds[f]);
	}

	// deleting rooms
	for (let d = 0; result.discussionsIds.length > d; d++) {
		deleteRoom(result.discussionsIds[d]);
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
