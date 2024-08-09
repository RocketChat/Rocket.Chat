import type { IMessage } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { Messages, Subscriptions, ReadReceipts, NotificationQueue } from '@rocket.chat/models';

import {
	notifyOnSubscriptionChangedByRoomIdAndUserIds,
	notifyOnSubscriptionChangedByRoomIdAndUserId,
} from '../../lib/server/lib/notifyListener';
import { getMentions, getUserIdsFromHighlights } from '../../lib/server/lib/notifyUsersOnMessage';

export async function reply({ tmid }: { tmid?: string }, message: IMessage, parentMessage: IMessage, followers: string[]) {
	if (!tmid || isEditedMessage(message)) {
		return false;
	}

	const { rid, ts, u } = message;

	const [highlightsUids, threadFollowers, { toAll, toHere, mentionIds }] = await Promise.all([
		getUserIdsFromHighlights(rid, message),
		Messages.getThreadFollowsByThreadId(tmid),
		getMentions(message),
	]);

	const addToReplies = [
		...new Set([...followers, ...mentionIds, ...(parentMessage.replies?.length ? [u._id] : [parentMessage.u._id, u._id])]),
	];

	const threadFollowersUids = threadFollowers?.filter((userId) => userId !== u._id && !mentionIds.includes(userId)) || [];

	// Notify everyone involved in the thread
	const notifyOptions = toAll || toHere ? { groupMention: true } : {};

	// Notify message mentioned users and highlights
	const mentionedUsers = [...new Set([...mentionIds, ...highlightsUids])];

	const promises = [
		Messages.updateRepliesByThreadId(tmid, addToReplies, ts),
		ReadReceipts.setAsThreadById(tmid),
		Subscriptions.addUnreadThreadByRoomIdAndUserIds(rid, threadFollowersUids, tmid, notifyOptions),
	];

	if (mentionedUsers.length) {
		promises.push(Subscriptions.addUnreadThreadByRoomIdAndUserIds(rid, mentionedUsers, tmid, { userMention: true }));
	}

	if (highlightsUids.length) {
		promises.push(
			Subscriptions.setAlertForRoomIdAndUserIds(rid, highlightsUids),
			Subscriptions.setOpenForRoomIdAndUserIds(rid, highlightsUids),
		);
	}

	await Promise.allSettled(promises);

	void notifyOnSubscriptionChangedByRoomIdAndUserIds(rid, [...threadFollowersUids, ...mentionedUsers, ...highlightsUids]);
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

	const removeUnreadThreadResponse = await Subscriptions.removeUnreadThreadByRoomIdAndUserId(rid, uid, tmid);
	if (removeUnreadThreadResponse.modifiedCount) {
		void notifyOnSubscriptionChangedByRoomIdAndUserId(rid, uid);
	}

	await Messages.removeThreadFollowerByThreadId(tmid, uid);
}

export const readThread = async ({ userId, rid, tmid }: { userId: string; rid: string; tmid: string }) => {
	const sub = await Subscriptions.findOneByRoomIdAndUserId(rid, userId, { projection: { tunread: 1 } });
	if (!sub) {
		return;
	}

	// if the thread being marked as read is the last one unread also clear the unread subscription flag
	const clearAlert = sub.tunread && sub.tunread?.length <= 1 && sub.tunread.includes(tmid);

	const removeUnreadThreadResponse = await Subscriptions.removeUnreadThreadByRoomIdAndUserId(rid, userId, tmid, clearAlert);
	if (removeUnreadThreadResponse.modifiedCount) {
		void notifyOnSubscriptionChangedByRoomIdAndUserId(rid, userId);
	}

	await NotificationQueue.clearQueueByUserId(userId);
};
