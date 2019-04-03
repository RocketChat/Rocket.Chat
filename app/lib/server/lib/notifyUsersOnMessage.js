import _ from 'underscore';
import s from 'underscore.string';
import moment from 'moment';
import { Rooms, Subscriptions } from '../../../models';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';

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

		// const usersToNotify = users || [message.u._id];

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

		if (room.t === 'd') {
			const unreadCountDM = settings.get('Unread_Count_DM');

			if (unreadCountDM === 'all_messages') {
				Subscriptions.incUnreadForRoomIdExcludingUserId(room._id, message.u._id);
			} else if (toAll || toHere) {
				Subscriptions.incGroupMentionsAndUnreadForRoomIdExcludingUserId(room._id, message.u._id, 1, 1);
			} else if ((mentionIds && mentionIds.length > 0) || (highlightsIds && highlightsIds.length > 0)) {
				Subscriptions.incUserMentionsAndUnreadForRoomIdAndUserIds(room._id, _.compact(_.unique(mentionIds.concat(highlightsIds))), 1, 1);
			}
		} else {
			const unreadCount = settings.get('Unread_Count');

			if (toAll || toHere) {
				let incUnread = 0;
				if (['all_messages', 'group_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount)) {
					incUnread = 1;
				}
				Subscriptions.incGroupMentionsAndUnreadForRoomIdExcludingUserId(room._id, message.u._id, 1, incUnread);

			} else if (users || (mentionIds && mentionIds.length > 0) || (highlightsIds && highlightsIds.length > 0)) {
				let incUnread = 0;
				if (users || ['all_messages', 'user_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount)) {
					incUnread = 1;
				}
				Subscriptions.incUserMentionsAndUnreadForRoomIdAndUserIds(room._id, _.compact(_.unique(mentionIds.concat(highlightsIds, users))), 1, incUnread);
			} else if (unreadCount === 'all_messages') {
				Subscriptions.incUnreadForRoomIdExcludingUserId(room._id, message.u._id);
			}
		}
	}

	// Update all the room activity tracker fields
	// This method take so long to execute on gient rooms cuz it will trugger the cache rebuild for the releations of that room
	Rooms.incMsgCountAndSetLastMessageById(message.rid, 1, message.ts, settings.get('Store_Last_Message') && message);
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

	if (message.tmid) {
		return message;
	}

	updateUsersSubscriptions(message, room);

	return message;
}

callbacks.add('afterSaveMessage', notifyUsersOnMessage, callbacks.priority.LOW, 'notifyUsersOnMessage');
