import type { IMessage, IRoom, IUser, RoomType } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { Subscriptions, Rooms } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import moment from 'moment';

import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';

function messageContainsHighlight(message: IMessage, highlights: string[]): boolean {
	if (!highlights || highlights.length === 0) return false;

	return highlights.some((highlight: string) => {
		const regexp = new RegExp(escapeRegExp(highlight), 'i');
		return regexp.test(message.msg);
	});
}

export async function getMentions(message: IMessage): Promise<{ toAll: boolean; toHere: boolean; mentionIds: string[] }> {
	const {
		mentions,
		u: { _id: senderId },
	} = message;

	if (!mentions) {
		return {
			toAll: false,
			toHere: false,
			mentionIds: [],
		};
	}

	const toAll = mentions.some(({ _id }) => _id === 'all');
	const toHere = mentions.some(({ _id }) => _id === 'here');

	const teamsMentions = mentions.filter((mention) => mention.type === 'team');
	const filteredMentions = mentions
		.filter((mention) => !mention.type || mention.type === 'user')
		.filter(({ _id }) => _id !== senderId && !['all', 'here'].includes(_id))
		.map(({ _id }) => _id);

	const mentionIds = await callbacks.run('beforeGetMentions', filteredMentions, teamsMentions);

	return {
		toAll,
		toHere,
		mentionIds,
	};
}

type UnreadCountType = 'all_messages' | 'user_mentions_only' | 'group_mentions_only' | 'user_and_group_mentions_only';

const incGroupMentions = async (
	rid: IRoom['_id'],
	roomType: RoomType,
	excludeUserId: IUser['_id'],
	unreadCount: Exclude<UnreadCountType, 'user_mentions_only'>,
): Promise<void> => {
	const incUnreadByGroup = ['all_messages', 'group_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount);
	const incUnread = roomType === 'd' || roomType === 'l' || incUnreadByGroup ? 1 : 0;
	await Subscriptions.incGroupMentionsAndUnreadForRoomIdExcludingUserId(rid, excludeUserId, 1, incUnread);
};

const incUserMentions = async (
	rid: IRoom['_id'],
	roomType: RoomType,
	uids: IUser['_id'][],
	unreadCount: Exclude<UnreadCountType, 'group_mentions_only'>,
): Promise<void> => {
	const incUnreadByUser = new Set(['all_messages', 'user_mentions_only', 'user_and_group_mentions_only']).has(unreadCount);
	const incUnread = roomType === 'd' || roomType === 'l' || incUnreadByUser ? 1 : 0;
	await Subscriptions.incUserMentionsAndUnreadForRoomIdAndUserIds(rid, uids, 1, incUnread);
};

export const getUserIdsFromHighlights = async (rid: IRoom['_id'], message: IMessage): Promise<string[]> => {
	const highlightOptions = { projection: { 'userHighlights': 1, 'u._id': 1 } };
	const subs = await Subscriptions.findByRoomWithUserHighlights(rid, highlightOptions).toArray();

	return subs
		.filter(
			({ userHighlights, u: { _id: uid } }) => userHighlights && messageContainsHighlight(message, userHighlights) && uid !== message.u._id,
		)
		.map(({ u: { _id: uid } }) => uid);
};

const getUnreadSettingCount = (roomType: RoomType): UnreadCountType => {
	let unreadSetting = 'Unread_Count';
	switch (roomType) {
		case 'd': {
			unreadSetting = 'Unread_Count_DM';
			break;
		}
		case 'l': {
			unreadSetting = 'Unread_Count_Omni';
			break;
		}
	}

	return settings.get(unreadSetting);
};

async function updateUsersSubscriptions(message: IMessage, room: IRoom): Promise<void> {
	// Don't increase unread counter on thread messages
	if (room != null && !message.tmid) {
		const { toAll, toHere, mentionIds } = await getMentions(message);

		const userIds = new Set(mentionIds);

		const unreadCount = getUnreadSettingCount(room.t);

		(await getUserIdsFromHighlights(room._id, message)).forEach((uid) => userIds.add(uid));

		// Give priority to user mentions over group mentions
		if (userIds.size > 0) {
			await incUserMentions(room._id, room.t, [...userIds], unreadCount as Exclude<UnreadCountType, 'group_mentions_only'>);
		} else if (toAll || toHere) {
			await incGroupMentions(room._id, room.t, message.u._id, unreadCount as Exclude<UnreadCountType, 'user_mentions_only'>);
		}

		// this shouldn't run only if has group mentions because it will already exclude mentioned users from the query
		if (!toAll && !toHere && unreadCount === 'all_messages') {
			await Subscriptions.incUnreadForRoomIdExcludingUserIds(room._id, [...userIds, message.u._id], 1);
		}
	}

	// Update all other subscriptions to alert their owners but without incrementing
	// the unread counter, as it is only for mentions and direct messages
	// We now set alert and open properties in two separate update commands. This proved to be more efficient on MongoDB - because it uses a more efficient index.
	await Promise.all([
		Subscriptions.setAlertForRoomIdExcludingUserId(message.rid, message.u._id),
		Subscriptions.setOpenForRoomIdExcludingUserId(message.rid, message.u._id),
	]);
}

export async function updateThreadUsersSubscriptions(message: IMessage, replies: IUser['_id'][]): Promise<void> {
	// Don't increase unread counter on thread messages

	await Subscriptions.setAlertForRoomIdAndUserIds(message.rid, replies);
	const repliesPlusSender = [...new Set([message.u._id, ...replies])];
	await Subscriptions.setOpenForRoomIdAndUserIds(message.rid, repliesPlusSender);
	await Subscriptions.setLastReplyForRoomIdAndUserIds(message.rid, repliesPlusSender, new Date());
}

export async function notifyUsersOnMessage(message: IMessage, room: IRoom, roomUpdater: Updater<IRoom>): Promise<IMessage> {
	console.log('notifyUsersOnMessage function');

	// Skips this callback if the message was edited and increments it if the edit was way in the past (aka imported)
	if (isEditedMessage(message)) {
		if (Math.abs(moment(message.editedAt).diff(Date.now())) > 60000) {
			// TODO: Review as I am not sure how else to get around this as the incrementing of the msgs count shouldn't be in this callback
			Rooms.getIncMsgCountUpdateQuery(1, roomUpdater);
			return message;
		}

		// Only updates last message if it was edited (skip rest of callback)
		if (
			settings.get('Store_Last_Message') &&
			(!message.tmid || message.tshow) &&
			(!room.lastMessage || room.lastMessage._id === message._id)
		) {
			Rooms.getLastMessageUpdateQuery(message, roomUpdater);
		}

		return message;
	}

	if (message.ts && Math.abs(moment(message.ts).diff(Date.now())) > 60000) {
		Rooms.getIncMsgCountUpdateQuery(1, roomUpdater);
		return message;
	}

	// If message sent ONLY on a thread, skips the rest as it is done on a callback specific to threads
	if (message.tmid && !message.tshow) {
		Rooms.getIncMsgCountUpdateQuery(1, roomUpdater);
		return message;
	}

	// Update all the room activity tracker fields
	Rooms.setIncMsgCountAndSetLastMessageUpdateQuery(1, message, !!settings.get('Store_Last_Message'), roomUpdater);
	await updateUsersSubscriptions(message, room);

	return message;
}

callbacks.add(
	'afterSaveMessage',
	async (message, { room, roomUpdater }) => {
		if (!roomUpdater) {
			return message;
		}

		await notifyUsersOnMessage(message, room, roomUpdater);

		return message;
	},
	callbacks.priority.MEDIUM,
	'notifyUsersOnMessage',
);
