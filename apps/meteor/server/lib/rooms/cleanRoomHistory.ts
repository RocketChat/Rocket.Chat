import { api } from '@rocket.chat/core-services';
import type { IRoom, MessageAttachment } from '@rocket.chat/core-typings';
import { Messages, Rooms, Subscriptions, ReadReceipts, ReadReceiptsArchive } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/tools';

import { deleteRoom } from './deleteRoom';
import { NOTIFICATION_ATTACHMENT_COLOR } from '../../../lib/constants';
import { i18n } from '../i18n';
import { SystemLogger } from '../logger/system';
import { FileUpload } from '../media/file-upload';
import { updateAndNotifyParentRoomWithParentMessage } from '../messaging/discussions/updateAndNotifyParentRoomWithParentMessage';
import { notifyOnMessageChange, notifyOnRoomChangedById, notifyOnSubscriptionChangedById } from '../notifyListener';

const FILE_CLEANUP_BATCH_SIZE = 1000;
const DISCUSSION_QUOTE_BATCH_SIZE = 500;

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

async function showDeletedFilesInDiscussionQuotes(
	discussions: Pick<IRoom, '_id' | 'pmid'>[],
	replaceWith: MessageAttachment,
): Promise<void> {
	const drids = discussions.map(({ _id }) => _id);
	const messageLinkPattern = `\\?msg=(${discussions.map(({ pmid = '' }) => escapeRegExp(pmid)).join('|')})$`;
	const quoteIds = (
		await Messages.findByDiscussionIdsOrQuotingInRoomIds(drids, messageLinkPattern, { projection: { _id: 1 } }).toArray()
	).map(({ _id }) => _id);
	if (!quoteIds.length) {
		return;
	}
	await Messages.replaceQuotedFileAttachmentsByMessageIds(quoteIds, messageLinkPattern, replaceWith);
	quoteIds.forEach((id) => void notifyOnMessageChange({ id }));
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
	ignoreDiscussionOrigin = false,
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
	ignoreDiscussionOrigin?: boolean;
}): Promise<number> {
	const gt = inclusive ? '$gte' : '$gt';
	const lt = inclusive ? '$lte' : '$lt';

	const ts = { [gt]: oldest, [lt]: latest };

	const text = `_${i18n.t('File_removed_by_prune')}_`;

	let fileCount = 0;

	const discussions = await Rooms.findDiscussionsWithOriginMessageByParentRoomId(rid, { projection: { pmid: 1 } }).toArray();
	const originIds = new Set(discussions.flatMap(({ pmid }) => (pmid ? [pmid] : [])));
	const discussionOriginIds = ignoreDiscussion && ignoreDiscussionOrigin ? [...originIds] : [];
	const prunedOriginIds = new Set<string>();

	const cursor = Messages.findFilesByRoomIdPinnedTimestampAndUsers(
		rid,
		excludePinned,
		ignoreDiscussion,
		ts,
		fromUsers,
		ignoreThreads,
		discussionOriginIds,
		{
			projection: { pinned: 1, files: 1 },
			limit,
		},
	);

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
		if (originIds.has(document._id)) {
			prunedOriginIds.add(document._id);
		}
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

	const prunedDiscussions = discussions.filter(({ pmid }) => pmid && prunedOriginIds.has(pmid));
	for (let i = 0; i < prunedDiscussions.length; i += DISCUSSION_QUOTE_BATCH_SIZE) {
		await showDeletedFilesInDiscussionQuotes(prunedDiscussions.slice(i, i + DISCUSSION_QUOTE_BATCH_SIZE), pruneMessageAttachment);
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
				discussionOriginIds,
			);
			if (!batch.length) {
				break;
			}

			const { count: batchCount, deletedIds } = await Messages.removeByIdPinnedTimestampLimitAndUsers(
				rid,
				excludePinned,
				ignoreDiscussion,
				ts,
				batch.length,
				fromUsers,
				ignoreThreads,
				batch,
			);
			count += batchCount;
			void api.broadcast('notify.deleteMessageBulk', rid, {
				rid,
				excludePinned,
				ignoreDiscussion,
				ts,
				users: fromUsers,
				ids: deletedIds,
			});
			await ReadReceipts.removeByMessageIds(deletedIds);
			await ReadReceiptsArchive.removeByMessageIds(deletedIds);

			remaining -= batch.length;
			if (batch.length < FILE_CLEANUP_BATCH_SIZE) {
				break;
			}
		}
	} finally {
		if (count) {
			const lastMessage = await Messages.getLastVisibleUserMessageSentByRoomId(rid);

			await Rooms.resetLastMessageById(rid, lastMessage, -count);

			await refreshDiscussionMetadataOnParentRoom(rid);

			void notifyOnRoomChangedById(rid);
		}
	}

	return count;
}
