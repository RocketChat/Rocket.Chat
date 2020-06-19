import { Messages, Subscriptions } from '../../models/server';

export const reply = ({ tmid }, { rid, ts, u, editedAt }, parentMessage) => {
	if (!tmid || editedAt) {
		return false;
	}

	const addToReplies = Array.isArray(parentMessage.replies) && parentMessage.replies.length ? [u._id] : [parentMessage.u._id, u._id];

	Messages.updateRepliesByThreadId(tmid, addToReplies, ts);

	const replies = Messages.getThreadFollowsByThreadId(tmid);

	// doesnt need to update the sender (u._id) subscription, so filter it
	Subscriptions.addUnreadThreadByRoomIdAndUserIds(rid, replies.filter((userId) => userId !== u._id), tmid);
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

export const readThread = ({ userId, rid, tmid }) => Subscriptions.removeUnreadThreadByRoomIdAndUserId(rid, userId, tmid);

export const readAllThreads = (rid, userId) => Subscriptions.removeAllUnreadThreadsByRoomIdAndUserId(rid, userId);
