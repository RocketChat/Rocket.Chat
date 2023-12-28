import { Subscriptions, Rooms } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import moment from 'moment';

import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';

/**
 * Chechs if a messages contains a user highlight
 *
 * @param {string} message
 * @param {array|undefined} highlights
 *
 * @returns {boolean}
 */
function messageContainsHighlight(message, highlights) {
	if (!highlights || highlights.length === 0) {
		return false;
	}

	return highlights.some((highlight) => {
		const regexp = new RegExp(escapeRegExp(highlight), 'i');
		return regexp.test(message.msg);
	});
}

export async function getMentions(message) {
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

	const userMentions = mentions.filter((mention) => !mention.type || mention.type === 'user');
	const otherMentions = mentions.filter((mention) => mention?.type !== 'user');

	const filteredMentions = userMentions.filter(({ _id }) => _id !== senderId && !['all', 'here'].includes(_id)).map(({ _id }) => _id);

	const mentionIds = await callbacks.run('beforeGetMentions', filteredMentions, {
		userMentions,
		otherMentions,
		message,
	});

	return {
		toAll,
		toHere,
		mentionIds,
	};
}

const incGroupMentions = async (rid, roomType, excludeUserId, unreadCount) => {
	const incUnreadByGroup = ['all_messages', 'group_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount);
	const incUnread = roomType === 'd' || roomType === 'l' || incUnreadByGroup ? 1 : 0;

	await Subscriptions.incGroupMentionsAndUnreadForRoomIdExcludingUserId(rid, excludeUserId, 1, incUnread);
};

const incUserMentions = async (rid, roomType, uids, unreadCount) => {
	const incUnreadByUser = ['all_messages', 'user_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount);
	const incUnread = roomType === 'd' || roomType === 'l' || incUnreadByUser ? 1 : 0;

	await Subscriptions.incUserMentionsAndUnreadForRoomIdAndUserIds(rid, uids, 1, incUnread);
};

export const getUserIdsFromHighlights = async (rid, message) => {
	const highlightOptions = { projection: { 'userHighlights': 1, 'u._id': 1 } };
	const subs = await Subscriptions.findByRoomWithUserHighlights(rid, highlightOptions).toArray();

	return subs
		.filter(
			({ userHighlights, u: { _id: uid } }) => userHighlights && messageContainsHighlight(message, userHighlights) && uid !== message.u._id,
		)
		.map(({ u: { _id: uid } }) => uid);
};

/*
 * {IRoom['t']} roomType - The type of the room
 * @returns {string} - The setting value for unread count
 */
const getUnreadSettingCount = (roomType) => {
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

async function updateUsersSubscriptions(message, room) {
	// Don't increase unread counter on thread messages
	if (room != null && !message.tmid) {
		const { toAll, toHere, mentionIds } = await getMentions(message);

		const userIds = new Set(mentionIds);

		const unreadCount = getUnreadSettingCount(room.t);

		(await getUserIdsFromHighlights(room._id, message)).forEach((uid) => userIds.add(uid));

		// give priority to user mentions over group mentions
		if (userIds.size > 0) {
			await incUserMentions(room._id, room.t, [...userIds], unreadCount);
		} else if (toAll || toHere) {
			await incGroupMentions(room._id, room.t, message.u._id, unreadCount);
		}

		// this shouldn't run only if has group mentions because it will already exclude mentioned users from the query
		if (!toAll && !toHere && unreadCount === 'all_messages') {
			await Subscriptions.incUnreadForRoomIdExcludingUserIds(room._id, [...userIds, message.u._id]);
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

export async function updateThreadUsersSubscriptions(message, room, replies) {
	// const unreadCount = settings.get('Unread_Count');

	// incUserMentions(room._id, room.t, replies, unreadCount);

	await Subscriptions.setAlertForRoomIdAndUserIds(message.rid, replies);

	const repliesPlusSender = [...new Set([message.u._id, ...replies])];

	await Subscriptions.setOpenForRoomIdAndUserIds(message.rid, repliesPlusSender);

	await Subscriptions.setLastReplyForRoomIdAndUserIds(message.rid, repliesPlusSender, new Date());
}

export async function notifyUsersOnMessage(message, room) {
	// skips this callback if the message was edited and increments it if the edit was way in the past (aka imported)
	if (message.editedAt) {
		if (Math.abs(moment(message.editedAt).diff()) > 60000) {
			// TODO: Review as I am not sure how else to get around this as the incrementing of the msgs count shouldn't be in this callback
			await Rooms.incMsgCountById(message.rid, 1);
			return message;
		}

		// only updates last message if it was edited (skip rest of callback)
		if (
			settings.get('Store_Last_Message') &&
			(!message.tmid || message.tshow) &&
			(!room.lastMessage || room.lastMessage._id === message._id)
		) {
			await Rooms.setLastMessageById(message.rid, message);
		}

		return message;
	}

	if (message.ts && Math.abs(moment(message.ts).diff()) > 60000) {
		await Rooms.incMsgCountById(message.rid, 1);
		return message;
	}

	// if message sent ONLY on a thread, skips the rest as it is done on a callback specific to threads
	if (message.tmid && !message.tshow) {
		await Rooms.incMsgCountById(message.rid, 1);
		return message;
	}

	// Update all the room activity tracker fields
	await Rooms.incMsgCountAndSetLastMessageById(message.rid, 1, message.ts, settings.get('Store_Last_Message') && message);

	await updateUsersSubscriptions(message, room);

	return message;
}

callbacks.add(
	'afterSaveMessage',
	(message, room) => notifyUsersOnMessage(message, room),
	callbacks.priority.MEDIUM,
	'notifyUsersOnMessage',
);
