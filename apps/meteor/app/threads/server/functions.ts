import type { IMessage } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { Messages, Subscriptions, ReadReceipts } from '@rocket.chat/models';

import { getMentions } from '../../lib/server/lib/notifyUsersOnMessage';

export async function reply({ tmid }: { tmid?: string }, message: IMessage, parentMessage: IMessage, followers: string[]) {
	const { rid, ts, u } = message;
	if (!tmid || isEditedMessage(message)) {
		return false;
	}

	const { toAll, toHere, mentionIds } = await getMentions(message);

	const addToReplies = [
		...new Set([
			...followers,
			...mentionIds,
			...(Array.isArray(parentMessage.replies) && parentMessage.replies.length ? [u._id] : [parentMessage.u._id, u._id]),
		]),
	];

	await Messages.updateRepliesByThreadId(tmid, addToReplies, ts);
	await ReadReceipts.setAsThreadById(tmid);

	const replies = await Messages.getThreadFollowsByThreadId(tmid);

	const repliesFiltered = (replies || []).filter((userId) => userId !== u._id).filter((userId) => !mentionIds.includes(userId));

	if (toAll || toHere) {
		await Subscriptions.addUnreadThreadByRoomIdAndUserIds(rid, repliesFiltered, tmid, {
			groupMention: true,
		});
	} else {
		await Subscriptions.addUnreadThreadByRoomIdAndUserIds(rid, repliesFiltered, tmid, {});
	}

	for await (const userId of mentionIds) {
		await Subscriptions.addUnreadThreadByRoomIdAndUserIds(rid, [userId], tmid, { userMention: true });
	}
}

export async function follow({ tmid, uid }: { tmid: string; uid: string }) {
	if (!tmid || !uid) {
		return false;
	}

	await Messages.addThreadFollowerByThreadId(tmid, uid);
}

export async function unfollow({ tmid, rid, uid }: { tmid: string; rid: string; uid: string }) {
	if (!tmid || !uid) {
		return false;
	}

	await Subscriptions.removeUnreadThreadByRoomIdAndUserId(rid, uid, tmid);

	await Messages.removeThreadFollowerByThreadId(tmid, uid);
}

export const readThread = async ({ userId, rid, tmid }: { userId?: string; rid: string; tmid: string }) => {
	const projection = { tunread: 1 };
	if (!userId) {
		return;
	}

	const sub = await Subscriptions.findOneByRoomIdAndUserId(rid, userId, { projection });
	if (!sub) {
		return;
	}
	// if the thread being marked as read is the last one unread also clear the unread subscription flag
	const clearAlert = sub.tunread && sub.tunread?.length <= 1 && sub.tunread.includes(tmid);

	await Subscriptions.removeUnreadThreadByRoomIdAndUserId(rid, userId, tmid, clearAlert);
};
