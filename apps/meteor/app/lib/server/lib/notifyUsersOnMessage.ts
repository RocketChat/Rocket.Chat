import type { IMessage, IRoom, IUser, RoomType } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { Subscriptions, Rooms } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import moment from 'moment';

import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';
import {
	notifyOnSubscriptionChanged,
	notifyOnSubscriptionChangedByRoomIdAndUserId,
	notifyOnSubscriptionChangedByRoomIdAndUserIds,
} from './notifyListener';

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

const getGroupMentions = (roomType: RoomType, unreadCount: Exclude<UnreadCountType, 'user_mentions_only'>): number => {
	const incUnreadByGroup = ['all_messages', 'group_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount);
	return roomType === 'd' || roomType === 'l' || incUnreadByGroup ? 1 : 0;
};

const getUserMentions = (roomType: RoomType, unreadCount: Exclude<UnreadCountType, 'group_mentions_only'>): number => {
	const incUnreadByUser = ['all_messages', 'user_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount);
	return roomType === 'd' || roomType === 'l' || incUnreadByUser ? 1 : 0;
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
	if (!room || message.tmid) {
		return;
	}

	const [mentions, highlightIds] = await Promise.all([getMentions(message), getUserIdsFromHighlights(room._id, message)]);

	const { toAll, toHere, mentionIds } = mentions;
	const userIds = [...new Set([...mentionIds, ...highlightIds])];
	const unreadCount = getUnreadSettingCount(room.t);

	const userMentionInc = getUserMentions(room.t, unreadCount as Exclude<UnreadCountType, 'group_mentions_only'>);
	const groupMentionInc = getGroupMentions(room.t, unreadCount as Exclude<UnreadCountType, 'user_mentions_only'>);

	void Subscriptions.findByRoomIdAndNotAlertOrOpenExcludingUserIds({
		roomId: room._id,
		uidsExclude: [message.u._id],
		uidsInclude: userIds,
		onlyRead: !toAll && !toHere && unreadCount !== 'all_messages',
	}).forEach((sub) => {
		const hasUserMention = userIds.includes(sub.u._id);
		const shouldIncUnread = hasUserMention || toAll || toHere || unreadCount === 'all_messages';
		void notifyOnSubscriptionChanged(
			{
				...sub,
				alert: true,
				open: true,
				...(shouldIncUnread && { unread: sub.unread + 1 }),
				...(hasUserMention && { userMentions: sub.userMentions + 1 }),
				...((toAll || toHere) && { groupMentions: sub.groupMentions + 1 }),
			},
			'updated',
		);
	});

	// Give priority to user mentions over group mentions
	if (userIds.length) {
		await Subscriptions.incUserMentionsAndUnreadForRoomIdAndUserIds(room._id, userIds, 1, userMentionInc);
	} else if (toAll || toHere) {
		await Subscriptions.incGroupMentionsAndUnreadForRoomIdExcludingUserId(room._id, message.u._id, 1, groupMentionInc);
	}

	if (!toAll && !toHere && unreadCount === 'all_messages') {
		await Subscriptions.incUnreadForRoomIdExcludingUserIds(room._id, [...userIds, message.u._id], 1);
	}

	// update subscriptions of other members of the room
	await Promise.all([
		Subscriptions.setAlertForRoomIdExcludingUserId(message.rid, message.u._id),
		Subscriptions.setOpenForRoomIdExcludingUserId(message.rid, message.u._id),
	]);

	// update subscription of the message sender
	await Subscriptions.setAsReadByRoomIdAndUserId(message.rid, message.u._id);
	const setAsReadResponse = await Subscriptions.setAsReadByRoomIdAndUserId(message.rid, message.u._id);
	if (setAsReadResponse.modifiedCount) {
		void notifyOnSubscriptionChangedByRoomIdAndUserId(message.rid, message.u._id);
	}
}

export async function updateThreadUsersSubscriptions(message: IMessage, replies: IUser['_id'][]): Promise<void> {
	// Don't increase unread counter on thread messages
	const repliesPlusSender = [...new Set([message.u._id, ...replies])];

	const responses = await Promise.all([
		Subscriptions.setAlertForRoomIdAndUserIds(message.rid, replies),
		Subscriptions.setOpenForRoomIdAndUserIds(message.rid, repliesPlusSender),
		Subscriptions.setLastReplyForRoomIdAndUserIds(message.rid, repliesPlusSender, new Date()),
	]);

	responses.some((response) => response?.modifiedCount) &&
		void notifyOnSubscriptionChangedByRoomIdAndUserIds(message.rid, repliesPlusSender);
}

export async function notifyUsersOnMessage(message: IMessage, room: IRoom, roomUpdater: Updater<IRoom>): Promise<IMessage> {
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

export async function notifyUsersOnSystemMessage(message: IMessage, room: IRoom): Promise<IMessage> {
	const roomUpdater = Rooms.getUpdater();
	Rooms.setIncMsgCountAndSetLastMessageUpdateQuery(1, message, !!settings.get('Store_Last_Message'), roomUpdater);

	if (roomUpdater.hasChanges()) {
		await Rooms.updateFromUpdater({ _id: room._id }, roomUpdater);
	}

	// TODO: Rewrite to use just needed calls from the function
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
