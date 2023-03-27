import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { IMessage, IMessageDiscussion, IRoom } from '@rocket.chat/core-typings';
import { api } from '@rocket.chat/core-services';
import { Messages as MessagesRaw, Rooms } from '@rocket.chat/models';

import { deleteRoom } from './deleteRoom';
import { FileUpload } from '../../../file-upload/server';
import { Messages, Subscriptions } from '../../../models/server';

export async function cleanRoomHistory({
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
}: {
	rid?: IRoom['_id'];
	latest?: Date;
	oldest?: Date;
	inclusive?: boolean;
	limit?: number;
	excludePinned?: boolean;
	ignoreDiscussion?: boolean;
	filesOnly?: boolean;
	fromUsers?: string[];
	ignoreThreads?: boolean;
}): Promise<number> {
	const gt = inclusive ? '$gte' : '$gt';
	const lt = inclusive ? '$lte' : '$lt';

	const ts = { [gt]: oldest, [lt]: latest };

	const text = `_${TAPi18n.__('File_removed_by_prune')}_`;

	let fileCount = 0;
	Messages.findFilesByRoomIdPinnedTimestampAndUsers(rid, excludePinned, ignoreDiscussion, ts, fromUsers, ignoreThreads, {
		fields: { pinned: 1, files: 1 },
		limit,
	}).forEach((document: IMessage) => {
		const uploadsStore = FileUpload.getStore('Uploads');

		document.files?.forEach((file) => uploadsStore.deleteById(file._id));
		fileCount++;
		if (filesOnly) {
			Messages.update({ _id: document._id }, { $unset: { file: 1 }, $set: { attachments: [{ color: '#FD745E', text }] } });
		}
	});

	if (filesOnly) {
		return fileCount;
	}

	if (!ignoreDiscussion) {
		Messages.findDiscussionByRoomIdPinnedTimestampAndUsers(rid, excludePinned, ts, fromUsers, {
			fields: { drid: 1 },
			...(limit && { limit }),
		}).forEach(({ drid }: IMessageDiscussion) => deleteRoom(drid));
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

	const count = await MessagesRaw.removeByIdPinnedTimestampLimitAndUsers(
		rid,
		excludePinned,
		ignoreDiscussion,
		ts,
		limit,
		fromUsers,
		ignoreThreads,
	);
	if (count) {
		const lastMessage = await MessagesRaw.getLastVisibleMessageSentWithNoTypeByRoomId(rid);
		await Rooms.resetLastMessageById(rid, lastMessage);
		void api.broadcast('notify.deleteMessageBulk', rid, {
			rid,
			excludePinned,
			ignoreDiscussion,
			ts,
			users: fromUsers,
		});
	}
	return count;
}
