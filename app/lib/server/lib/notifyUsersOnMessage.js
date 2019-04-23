import _ from 'underscore';
import s from 'underscore.string';
import moment from 'moment';

import { Rooms, Subscriptions } from '../../../models/server';
import { settings } from '../../../settings/server';
import { callbacks } from '../../../callbacks/server';

/**
 * Chechs if a messages contains a user highlight
 *
 * @param {string} message
 * @param {array|undefined} highlights
 *
 * @returns {boolean}
 */

export function messageContainsHighlight(message, highlights) {
	if (! highlights || highlights.length === 0) { return false; }

	return highlights.some(function(highlight) {
		const regexp = new RegExp(s.escapeRegExp(highlight), 'i');
		return regexp.test(message.msg);
	});
}

export function updateUsersSubscriptions(message, room, users) {
	if (room != null) {
		let toAll = false;
		let toHere = false;
		const mentionIds = [];
		const highlightsIds = [];

		const highlightOptions = { fields: { userHighlights: 1, 'u._id': 1 } };

		const highlights = users ?
			Subscriptions.findByRoomAndUsersWithUserHighlights(room._id, users, highlightOptions).fetch() :
			Subscriptions.findByRoomWithUserHighlights(room._id, highlightOptions).fetch();

		if (message.mentions != null) {
			message.mentions.forEach(function(mention) {
				if (!toAll && mention._id === 'all') {
					toAll = true;
				}
				if (!toHere && mention._id === 'here') {
					toHere = true;
				}
				if (mention._id !== message.u._id) {
					mentionIds.push(mention._id);
				}
			});
		}

		highlights.forEach(function(subscription) {
			if (subscription.userHighlights && messageContainsHighlight(message, subscription.userHighlights)) {
				if (subscription.u._id !== message.u._id) {
					highlightsIds.push(subscription.u._id);
				}
			}
		});

		const unreadSetting = room.t === 'd' ? 'Unread_Count_DM' : 'Unread_Count';
		const unreadCount = settings.get(unreadSetting);

		if (toAll || toHere) {
			const incUnreadByGroup = ['all_messages', 'group_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount);
			const incUnread = room.t === 'd' || incUnreadByGroup ? 1 : 0;

			Subscriptions.incGroupMentionsAndUnreadForRoomIdExcludingUserId(room._id, message.u._id, 1, incUnread);
		} else if (users || (mentionIds && mentionIds.length > 0) || (highlightsIds && highlightsIds.length > 0)) {
			const incUnreadByUser = ['all_messages', 'user_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount);
			const incUnread = room.t === 'd' || users || incUnreadByUser ? 1 : 0;

			Subscriptions.incUserMentionsAndUnreadForRoomIdAndUserIds(room._id, _.compact(_.unique(mentionIds.concat(highlightsIds, users))), 1, incUnread);
		} else if (unreadCount === 'all_messages') {
			Subscriptions.incUnreadForRoomIdExcludingUserId(room._id, message.u._id);
		}
	}

	// Update all other subscriptions to alert their owners but witout incrementing
	// the unread counter, as it is only for mentions and direct messages
	// We now set alert and open properties in two separate update commands. This proved to be more efficient on MongoDB - because it uses a more efficient index.
	Subscriptions.setAlertForRoomIdExcludingUserId(message.rid, message.u._id);
	Subscriptions.setOpenForRoomIdExcludingUserId(message.rid, message.u._id);
}

function notifyUsersOnMessage(message, room) {
	// skips this callback if the message was edited and increments it if the edit was way in the past (aka imported)
	if (message.editedAt && Math.abs(moment(message.editedAt).diff()) > 60000) {
		// TODO: Review as I am not sure how else to get around this as the incrementing of the msgs count shouldn't be in this callback
		Rooms.incMsgCountById(message.rid, 1);
		return message;
	} else if (message.editedAt) {

		// only updates last message if it was edited (skip rest of callback)
		if (settings.get('Store_Last_Message') && (!room.lastMessage || room.lastMessage._id === message._id)) {
			Rooms.setLastMessageById(message.rid, message);
		}
		return message;
	}

	if (message.ts && Math.abs(moment(message.ts).diff()) > 60000) {
		Rooms.incMsgCountById(message.rid, 1);
		return message;
	}

	// Update all the room activity tracker fields
	Rooms.incMsgCountAndSetLastMessageById(message.rid, 1, message.ts, settings.get('Store_Last_Message') && message);

	if (message.tmid) {
		return message;
	}

	updateUsersSubscriptions(message, room);

	return message;
}

callbacks.add('afterSaveMessage', notifyUsersOnMessage, callbacks.priority.LOW, 'notifyUsersOnMessage');
