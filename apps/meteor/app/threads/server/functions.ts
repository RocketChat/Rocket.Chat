import type { IMessage } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { Messages, Subscriptions, ReadReceipts, NotificationQueue, Rooms } from '@rocket.chat/models';

import {
	notifyOnSubscriptionChangedByRoomIdAndUserIds,
	notifyOnSubscriptionChangedByRoomIdAndUserId,
} from '../../lib/server/lib/notifyListener';
import { getMentions, getUserIdsFromHighlights, getUnreadSettingCount, getGroupMentions } from '../../lib/server/lib/notifyUsersOnMessage';

export async function reply({ tmid }: { tmid?: string }, message: IMessage, parentMessage: IMessage, followers: string[]) {
	if (!tmid || isEditedMessage(message)) {
		return false;
	}

	const { rid, ts, u } = message;

	const { toAll, toHere, mentionIds } = await getMentions(message);

	const addToReplies = [
		...new Set([
			...followers,
			...mentionIds,
			...(Array.isArray(parentMessage.replies) && parentMessage.replies.length ? [u._id] : [parentMessage.u._id, u._id]),
		]),
	];

	await Messages.updateRepliesByThreadId(tmid, addToReplies, ts);

	const [highlightsUids, threadFollowers] = await Promise.all([
		getUserIdsFromHighlights(rid, message),
		Messages.getThreadFollowsByThreadId(tmid),
	]);

	const threadFollowersUids = threadFollowers?.filter((userId) => userId !== u._id && !mentionIds.includes(userId)) || [];

	// Notify everyone involved in the thread

	// Notify message mentioned users and highlights
	const mentionedUsers = [...new Set([...mentionIds, ...highlightsUids])];

	// FIX: When @all or @here is used, fetch ALL room members (not just thread followers)
	// This ensures all room members get notifications, highlights, and unread counts
	let allRoomMemberIds: string[] = [];
	if (toAll || toHere) {
		const roomSubscriptions = await Subscriptions.findByRoomId(rid, {
			projection: { 'u._id': 1 },
		}).toArray();
		allRoomMemberIds = roomSubscriptions.map((sub) => sub.u._id).filter((userId) => userId !== u._id); // Exclude sender
	}

	// FIX: Include all room members in affected users when @all/@here is used
	const allAffectedUserIds = [...new Set([...threadFollowersUids, ...mentionedUsers, ...(toAll || toHere ? allRoomMemberIds : [])])];

	const notifyOptions = toAll || toHere ? { groupMention: true } : {};

	const promises = [
		ReadReceipts.setAsThreadById(tmid),
		Subscriptions.addUnreadThreadByRoomIdAndUserIds(rid, threadFollowersUids, tmid, notifyOptions),
	];

	if (mentionedUsers.length) {
		promises.push(Subscriptions.addUnreadThreadByRoomIdAndUserIds(rid, mentionedUsers, tmid, { userMention: true }));
	}

	// FIX: Mark thread as unread for ALL room members when @all/@here is used
	// This ensures thread badge appears for all users, not just thread followers
	if (toAll || toHere) {
		promises.push(Subscriptions.addUnreadThreadByRoomIdAndUserIds(rid, allRoomMemberIds, tmid, notifyOptions));
	}

	if (highlightsUids.length) {
		promises.push(
			Subscriptions.setAlertForRoomIdAndUserIds(rid, highlightsUids),
			Subscriptions.setOpenForRoomIdAndUserIds(rid, highlightsUids),
		);
	}

	// FIX: Set channel alert/open and increment unread counts for ALL room members when @all/@here is used
	// This ensures channel highlighting and unread counts work for all users, not just thread followers
	if (toAll || toHere) {
		const room = await Rooms.findOneById(rid);
		if (room) {
			const unreadCount = getUnreadSettingCount(room.t);
			const groupMentionInc = getGroupMentions(
				room.t,
				unreadCount as Exclude<
					'all_messages' | 'user_mentions_only' | 'group_mentions_only' | 'user_and_group_mentions_only',
					'user_mentions_only'
				>,
			);

			promises.push(
				Subscriptions.setAlertForRoomIdExcludingUserId(rid, u._id),
				Subscriptions.setOpenForRoomIdExcludingUserId(rid, u._id),
				Subscriptions.incGroupMentionsAndUnreadForRoomIdExcludingUserId(rid, u._id, 1, groupMentionInc),
			);
		}
	}

	await Promise.allSettled(promises);

	void notifyOnSubscriptionChangedByRoomIdAndUserIds(rid, allAffectedUserIds);
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
