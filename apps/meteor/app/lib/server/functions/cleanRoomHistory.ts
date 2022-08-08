import type { FindCursor } from 'mongodb';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { IMessage, IMessageDiscussion } from '@rocket.chat/core-typings';

import { deleteRoom } from './deleteRoom';
import { FileUpload } from '../../../file-upload/server';
import { Messages, Rooms, Subscriptions } from '../../../models/server';
import { api } from '../../../../server/sdk/api';

export const cleanRoomHistory = function ({
	rid = '',
	latest = new Date(),
	oldest = new Date('0001-01-01T00:00:00Z'),
	inclusive = true,
	limit = 0,
	excludePinned = true,
	ignoreDiscussion = true,
	filesOnly = false,
	fromUsers = [],
	ignoreThreads = true,
}): unknown {
	const gt = inclusive ? '$gte' : '$gt';
	const lt = inclusive ? '$lte' : '$lt';

	const ts = { [gt]: oldest, [lt]: latest };

	const text = `_${TAPi18n.__('File_removed_by_prune')}_`;

	let fileCount = 0;
	Messages.findFilesByRoomIdPinnedTimestampAndUsers(rid, excludePinned, ignoreDiscussion, ts, fromUsers, ignoreThreads, {
		fields: { 'file._id': 1, 'pinned': 1 },
		limit,
	}).forEach((document: IMessage) => {
		FileUpload.getStore('Uploads').deleteById(document.file?._id);
		fileCount++;
		if (filesOnly) {
			Messages.update({ _id: document._id }, { $unset: { file: 1 }, $set: { attachments: [{ color: '#FD745E', text }] } });
		}
	});

	if (filesOnly) {
		return fileCount;
	}

	if (!ignoreDiscussion) {
		Promise.await(
			(
				Messages.findDiscussionByRoomIdPinnedTimestampAndUsers(rid, excludePinned, ts, fromUsers, {
					fields: { drid: 1 },
					...(limit && { limit }),
				}) as FindCursor<IMessageDiscussion>
			).forEach(({ drid }) => deleteRoom(drid)),
		);
	}

	if (!ignoreThreads) {
		const threads = new Set();
		Messages.findThreadsByRoomIdPinnedTimestampAndUsers(
			{ rid, pinned: excludePinned, ignoreDiscussion, ts, users: fromUsers },
			{ fields: { _id: 1 } },
		).forEach(({ _id }: { _id: string }) => threads.add(_id));

		if (threads.size > 0) {
			Subscriptions.removeUnreadThreadsByRoomId(rid, [...threads]);
		}
	}

	const count = Messages.removeByIdPinnedTimestampLimitAndUsers(rid, excludePinned, ignoreDiscussion, ts, limit, fromUsers, ignoreThreads);
	if (count) {
		Rooms.resetLastMessageById(rid);
		api.broadcast('notify.deleteMessageBulk', rid, {
			rid,
			excludePinned,
			ignoreDiscussion,
			ts,
			users: fromUsers,
		});
	}
	return count;
};
