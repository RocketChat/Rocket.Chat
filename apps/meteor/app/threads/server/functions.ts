import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { Messages, Subscriptions, ReadReceipts, NotificationQueue, Rooms } from '@rocket.chat/models';

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

	const { toAll, toHere, mentionIds } = await getMentions(message);

	const filterUsersInRoom = async ({
		roomId,
		userIds,
		room,
	}: {
		roomId: string;
		userIds: string[];
		room: IRoom | null;
	}) => {
		try {
			if (!userIds.length || !room) {
				return [];
			}

			if (room.t === 'd') {
				return userIds.filter((userId) => room.uids?.includes(userId));
			}

			if (room.t === 'p' || room.t === 'c') {
				const subscriptions = await Subscriptions.findByRoomIdAndUserIds(roomId, userIds, {
					projection: { u: 1 },
				}).toArray();

				return subscriptions.map((sub) => sub.u._id);
			}

			return [];
		} catch (error) {
			console.error('Error filtering users in room:', { roomId, error });
			return [];
		}
	};

	const room = await Rooms.findOneById(rid);
	const [highlightsUids, threadFollowers] = await Promise.all([
		getUserIdsFromHighlights(rid, message),
		Messages.getThreadFollowsByThreadId(tmid),
	]);

	const [followersInRoom, mentionIdsInRoom, highlightsUidsInRoom] = await Promise.all([
		filterUsersInRoom({ roomId: rid, userIds: followers, room }),
		filterUsersInRoom({ roomId: rid, userIds: mentionIds, room }),
		filterUsersInRoom({ roomId: rid, userIds: highlightsUids, room }),
	]);

	const addToReplies = [
		...new Set([
			...followersInRoom,
			...mentionIdsInRoom,
			...(Array.isArray(parentMessage.replies) && parentMessage.replies.length ? [u._id] : [parentMessage.u._id, u._id]),
		]),
	];

	await Messages.updateRepliesByThreadId(tmid, addToReplies, ts);

	const threadFollowersUids = threadFollowers?.filter((userId) => userId !== u._id && !mentionIdsInRoom.includes(userId)) || [];

	// Notify everyone involved in the thread
	const notifyOptions = toAll || toHere ? { groupMention: true } : {};

	// Notify message mentioned users and highlights
	const mentionedUsers = [...new Set([...mentionIdsInRoom, ...highlightsUidsInRoom])];

	const promises = [
		ReadReceipts.setAsThreadById(tmid),
		Subscriptions.addUnreadThreadByRoomIdAndUserIds(rid, threadFollowersUids, tmid, notifyOptions),
	];

	if (mentionedUsers.length) {
		promises.push(Subscriptions.addUnreadThreadByRoomIdAndUserIds(rid, mentionedUsers, tmid, { userMention: true }));
	}

	if (highlightsUidsInRoom.length) {
		promises.push(
			Subscriptions.setAlertForRoomIdAndUserIds(rid, highlightsUidsInRoom),
			Subscriptions.setOpenForRoomIdAndUserIds(rid, highlightsUidsInRoom),
		);
	}

	await Promise.allSettled(promises);

	void notifyOnSubscriptionChangedByRoomIdAndUserIds(rid, [...threadFollowersUids, ...mentionedUsers, ...highlightsUidsInRoom]);
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