import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { deleteRoom } from './deleteRoom';
import { FileUpload } from '../../../file-upload/server';
import { Messages, Rooms, Subscriptions } from '../../../models/server';
import { Notifications } from '../../../notifications/server';
import { Message } from '../../../../server/sdk';

export function cleanRoomHistory({ rid, userId, latest, oldest, inclusive = true, limit = 0, excludePinned = true, ignoreDiscussion = true, filesOnly = false, fromUsers = [], ignoreThreads = true }) {
	const gt = inclusive ? '$gte' : '$gt';
	const lt = inclusive ? '$lte' : '$lt';

	const ts = { [gt]: oldest, [lt]: latest };

	const text = `_${ TAPi18n.__('File_removed_by_prune') }_`;

	let fileCount = 0;

	const { records: files } = Promise.await(Message.getFiles({
		rid,
		userId,
		excludePinned,
		ignoreDiscussion,
		oldest,
		latest,
		inclusive,
		fromUsers,
		ignoreThreads,
		queryOptions: {
			returnTotal: false,
			fields: { 'file._id': 1, pinned: 1 },
			limit,
		},
	}));

	files.map((document) => {
		FileUpload.getStore('Uploads').deleteById(document.file._id);
		fileCount++;
		if (filesOnly) {
			Messages.update({ _id: document._id }, { $unset: { file: 1 }, $set: { attachments: [{ color: '#FD745E', text }] } });
		}
		return null;
	});

	if (filesOnly) {
		return fileCount;
	}

	if (!ignoreDiscussion) {
		Promise.await(Message.getDiscussions({
			rid,
			userId,
			excludePinned,
			latest,
			oldest,
			inclusive,
			fromUsers,
			queryOptions: { returnTotal: false, fields: { drid: 1 }, ...limit && { limit } },
			ignoreThreads,
		}))
			.records.map(({ drid }) => deleteRoom(drid));
	}

	if (!ignoreThreads) {
		const threads = new Set();
		Promise.await(Message.getThreadsByRoomId({ rid, userId, pinned: excludePinned, ignoreDiscussion, ts, users: fromUsers, queryOptions: { returnTotal: false, fields: { _id: 1 } } }))
			.records.map(({ _id }) => threads.add(_id));

		if (threads.size > 0) {
			Subscriptions.removeUnreadThreadsByRoomId(rid, [...threads]);
		}
	}

	const count = Messages.removeByIdPinnedTimestampLimitAndUsers(rid, excludePinned, ignoreDiscussion, ts, limit, fromUsers, ignoreThreads);
	if (count) {
		Rooms.resetLastMessageById(rid);
		Notifications.notifyRoom(rid, 'deleteMessageBulk', {
			rid,
			excludePinned,
			ignoreDiscussion,
			ts,
			users: fromUsers,
		});
	}
	return count;
}
