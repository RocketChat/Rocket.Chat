import { Messages, Subscriptions } from '../../models/server';

export const reply = ({ tmid }, { rid, ts, u }, parentMessage) => {

	if (!tmid) {
		return false;
	}

	Messages.updateRepliesByThreadId(tmid, [parentMessage.u._id, u._id], ts);

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
