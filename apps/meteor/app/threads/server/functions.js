import { Messages, Subscriptions } from '../../models/server';
import { getMentions } from '../../lib/server/lib/notifyUsersOnMessage';

export const reply = ({ tmid }, message, parentMessage, followers) => {
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

	Messages.updateRepliesByThreadId(tmid, addToReplies, ts);

	const replies = Messages.getThreadFollowsByThreadId(tmid);

	const repliesFiltered = replies.filter((userId) => userId !== u._id).filter((userId) => !mentionIds.includes(userId));

	if (toAll || toHere) {
		Subscriptions.addUnreadThreadByRoomIdAndUserIds(rid, repliesFiltered, tmid, {
			groupMention: true,
		});
	} else {
		Subscriptions.addUnreadThreadByRoomIdAndUserIds(rid, repliesFiltered, tmid);
	}

	mentionIds.forEach((mentionId) => Subscriptions.addUnreadThreadByRoomIdAndUserIds(rid, [mentionId], tmid, { userMention: true }));
};

export const undoReply = ({ tmid }) => {
	if (!tmid) {
		return false;
	}

	const { ts } = Messages.getFirstReplyTsByThreadId(tmid) || {};
	if (!ts) {
		return Messages.unsetThreadByThreadId(tmid);
	}

	return Messages.updateThreadLastMessageAndCountByThreadId(tmid, ts, -1);
};

export const follow = ({ tmid, uid }) => {
	if (!tmid || !uid) {
		return false;
	}

	Messages.addThreadFollowerByThreadId(tmid, uid);
};

export const unfollow = ({ tmid, rid, uid }) => {
	if (!tmid || !uid) {
		return false;
	}

	Subscriptions.removeUnreadThreadByRoomIdAndUserId(rid, uid, tmid);

	return Messages.removeThreadFollowerByThreadId(tmid, uid);
};

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

export const readAllThreads = (rid, userId) => Subscriptions.removeAllUnreadThreadsByRoomIdAndUserId(rid, userId);
