import { Messages } from '@rocket.chat/models';

import { Subscriptions } from '../../models/server';
import { getMentions } from '../../lib/server/lib/notifyUsersOnMessage';

export async function reply({ tmid }, message, parentMessage, followers) {
	const { rid, ts, u, editedAt } = message;
	if (!tmid || editedAt) {
		return false;
	}

	const { toAll, toHere, mentionIds } = getMentions(message);

	const addToReplies = [
		...new Set([
			...followers,
			...mentionIds,
			...(Array.isArray(parentMessage.replies) && parentMessage.replies.length ? [u._id] : [parentMessage.u._id, u._id]),
		]),
	];

	await Messages.updateRepliesByThreadId(tmid, addToReplies, ts);

	const replies = await Messages.getThreadFollowsByThreadId(tmid);

	const repliesFiltered = replies.filter((userId) => userId !== u._id).filter((userId) => !mentionIds.includes(userId));

	if (toAll || toHere) {
		Subscriptions.addUnreadThreadByRoomIdAndUserIds(rid, repliesFiltered, tmid, {
			groupMention: true,
		});
	} else {
		Subscriptions.addUnreadThreadByRoomIdAndUserIds(rid, repliesFiltered, tmid);
	}

	mentionIds.forEach((mentionId) => Subscriptions.addUnreadThreadByRoomIdAndUserIds(rid, [mentionId], tmid, { userMention: true }));
}

export async function follow({ tmid, uid }) {
	if (!tmid || !uid) {
		return false;
	}

	await Messages.addThreadFollowerByThreadId(tmid, uid);
}

export async function unfollow({ tmid, rid, uid }) {
	if (!tmid || !uid) {
		return false;
	}

	Subscriptions.removeUnreadThreadByRoomIdAndUserId(rid, uid, tmid);

	await Messages.removeThreadFollowerByThreadId(tmid, uid);
}

export const readThread = ({ userId, rid, tmid }) => {
	const fields = { tunread: 1 };
	const sub = Subscriptions.findOneByRoomIdAndUserId(rid, userId, { fields });
	if (!sub) {
		return;
	}
	// if the thread being marked as read is the last one unread also clear the unread subscription flag
	const clearAlert = sub.tunread?.length <= 1 && sub.tunread.includes(tmid);

	Subscriptions.removeUnreadThreadByRoomIdAndUserId(rid, userId, tmid, clearAlert);
};
