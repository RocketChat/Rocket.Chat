import { api } from '@rocket.chat/core-services';
import type { IRoom } from '@rocket.chat/core-typings';
import { Messages, Rooms, Subscriptions, ReadReceipts, Users } from '@rocket.chat/models';

import { i18n } from '../../../../server/lib/i18n';
import { FileUpload } from '../../../file-upload/server';
import { deleteRoom } from './deleteRoom';

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

	const text = `_${i18n.t('File_removed_by_prune')}_`;

	let fileCount = 0;

	const cursor = Messages.findFilesByRoomIdPinnedTimestampAndUsers(rid, excludePinned, ignoreDiscussion, ts, fromUsers, ignoreThreads, {
		projection: { pinned: 1, files: 1 },
		limit,
	});

	for await (const document of cursor) {
		const uploadsStore = FileUpload.getStore('Uploads');

		document.files && (await Promise.all(document.files.map((file) => uploadsStore.deleteById(file._id))));

		fileCount++;
		if (filesOnly) {
			await Messages.updateOne({ _id: document._id }, { $unset: { file: 1 }, $set: { attachments: [{ color: '#FD745E', text }] } });
		}
	}

	if (filesOnly) {
		return fileCount;
	}

	if (!ignoreDiscussion) {
		const discussionsCursor = Messages.findDiscussionByRoomIdPinnedTimestampAndUsers(rid, excludePinned, ts, fromUsers, {
			projection: { drid: 1 },
			...(limit && { limit }),
		});

		for await (const { drid } of discussionsCursor) {
			if (!drid) {
				continue;
			}
			await deleteRoom(drid);
		}
	}

	if (!ignoreThreads) {
		const threads = new Set<string>();
		await Messages.findThreadsByRoomIdPinnedTimestampAndUsers(
			{ rid, pinned: excludePinned, ignoreDiscussion, ts, users: fromUsers },
			{ projection: { _id: 1 } },
		).forEach(({ _id }) => {
			threads.add(_id);
		});

		if (threads.size > 0) {
			await Subscriptions.removeUnreadThreadsByRoomId(rid, [...threads]);
		}
	}

	const selectedMessageIds = limit
		? await Messages.findByIdPinnedTimestampLimitAndUsers(rid, excludePinned, ignoreDiscussion, ts, limit, fromUsers, ignoreThreads)
		: undefined;
	const count = await Messages.removeByIdPinnedTimestampLimitAndUsers(
		rid,
		excludePinned,
		ignoreDiscussion,
		ts,
		limit,
		fromUsers,
		ignoreThreads,
		selectedMessageIds,
	);

	if (!limit) {
		const uids = await Users.findByUsernames(fromUsers, { projection: { _id: 1 } })
			.map((user) => user._id)
			.toArray();
		await ReadReceipts.removeByIdPinnedTimestampLimitAndUsers(rid, excludePinned, ignoreDiscussion, ts, uids, ignoreThreads);
	} else if (selectedMessageIds) {
		await ReadReceipts.removeByMessageIds(selectedMessageIds);
	}

	if (count) {
		const lastMessage = await Messages.getLastVisibleMessageSentWithNoTypeByRoomId(rid);

		await Rooms.resetLastMessageById(rid, lastMessage, -count);

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
