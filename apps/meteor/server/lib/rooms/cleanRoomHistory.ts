import { api } from '@rocket.chat/core-services';
import type { IRoom } from '@rocket.chat/core-typings';
import { Messages, Rooms, Subscriptions, ReadReceipts, ReadReceiptsArchive } from '@rocket.chat/models';

import { deleteRoom } from './deleteRoom';
import { NOTIFICATION_ATTACHMENT_COLOR } from '../../../lib/constants';
import { i18n } from '../i18n';
import { SystemLogger } from '../logger/system';
import { FileUpload } from '../media/file-upload';
import { updateAndNotifyParentRoomWithParentMessage } from '../messaging/discussions/updateAndNotifyParentRoomWithParentMessage';
import { notifyOnRoomChangedById, notifyOnSubscriptionChangedById } from '../notifyListener';

const FILE_CLEANUP_BATCH_SIZE = 1000;

async function refreshDiscussionMetadataOnParentRoom(rid: IRoom['_id']): Promise<void> {
	try {
		const room = await Rooms.findOneDiscussionById(rid, { projection: { msgs: 1, lm: 1, sysMes: 1 } });
		if (!room) {
			return;
		}

		await updateAndNotifyParentRoomWithParentMessage(room);
	} catch (err) {
		SystemLogger.error({ msg: 'Failed to propagate discussion metadata', err, rid });
	}
}

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

	const targetMessageIdsForAttachmentRemoval = new Set<string>();
	// Since we remove every file from the messages, we don't need to specify which fileId has been removed.
	const pruneMessageAttachment = { type: 'removed-file', color: NOTIFICATION_ATTACHMENT_COLOR, text };

	async function performFileAttachmentCleanupBatch() {
		if (targetMessageIdsForAttachmentRemoval.size === 0) return;

		const ids = [...targetMessageIdsForAttachmentRemoval];
		await Messages.removeFileAttachmentsByMessageIds(ids, pruneMessageAttachment);
		await Messages.clearFilesByMessageIds(ids);
		void api.broadcast('notify.deleteMessageBulk', rid, {
			rid,
			excludePinned,
			ignoreDiscussion,
			ts,
			users: fromUsers,
			ids,
			filesOnly: true,
			replaceFileAttachmentsWith: pruneMessageAttachment,
		});
		targetMessageIdsForAttachmentRemoval.clear();
	}

	for await (const document of cursor) {
		const uploadsStore = FileUpload.getStore('Uploads');

		document.files && (await Promise.all(document.files.map((file) => uploadsStore.deleteById(file._id))));

		fileCount++;
		if (filesOnly) {
			targetMessageIdsForAttachmentRemoval.add(document._id);
		}

		if (targetMessageIdsForAttachmentRemoval.size >= FILE_CLEANUP_BATCH_SIZE) {
			await performFileAttachmentCleanupBatch();
		}
	}

	if (targetMessageIdsForAttachmentRemoval.size > 0) {
		await performFileAttachmentCleanupBatch();
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
		const threads: string[] = [];

		await Messages.findThreadsByRoomIdPinnedTimestampAndUsers(
			{ rid, pinned: excludePinned, ignoreDiscussion, ts, users: fromUsers },
			{ projection: { _id: 1 } },
		).forEach(({ _id }) => {
			threads.push(_id);
		});

		for (let i = 0; i < threads.length; i += FILE_CLEANUP_BATCH_SIZE) {
			const batch = threads.slice(i, i + FILE_CLEANUP_BATCH_SIZE);
			const subscriptionIds: string[] = (
				await Subscriptions.findUnreadThreadsByRoomId(rid, batch, { projection: { _id: 1 } }).toArray()
			).map(({ _id }) => _id);

			const { modifiedCount } = await Subscriptions.removeUnreadThreadsByRoomId(rid, batch);
			if (modifiedCount) {
				subscriptionIds.forEach((id) => notifyOnSubscriptionChangedById(id));
			}
		}
	}

	const selectedMessageIds: string[] | undefined = limit ? [] : undefined;
	let remaining = limit || Infinity;
	let count = 0;

	try {
		while (remaining > 0) {
			const batch = await Messages.findByIdPinnedTimestampLimitAndUsers(
				rid,
				excludePinned,
				ignoreDiscussion,
				ts,
				Math.min(FILE_CLEANUP_BATCH_SIZE, remaining),
				fromUsers,
				ignoreThreads,
			);
			if (!batch.length) {
				break;
			}

			count += await Messages.removeByIdPinnedTimestampLimitAndUsers(
				rid,
				excludePinned,
				ignoreDiscussion,
				ts,
				batch.length,
				fromUsers,
				ignoreThreads,
				batch,
			);
			await ReadReceipts.removeByMessageIds(batch);
			await ReadReceiptsArchive.removeByMessageIds(batch);

			remaining -= batch.length;
			selectedMessageIds?.push(...batch);
		}
	} finally {
		if (count) {
			const lastMessage = await Messages.getLastVisibleUserMessageSentByRoomId(rid);

			await Rooms.resetLastMessageById(rid, lastMessage, -count);

			await refreshDiscussionMetadataOnParentRoom(rid);

			void notifyOnRoomChangedById(rid);

			void api.broadcast('notify.deleteMessageBulk', rid, {
				rid,
				excludePinned,
				ignoreDiscussion,
				ts,
				users: fromUsers,
				ids: selectedMessageIds,
			});
		}
	}

	return count;
}
