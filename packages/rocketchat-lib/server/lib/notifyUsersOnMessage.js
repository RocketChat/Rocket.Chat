import _ from 'underscore';
import s from 'underscore.string';
import moment from 'moment';

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

function notifyUsersOnMessage(message, room) {
	// skips this callback if the message was edited and increments it if the edit was way in the past (aka imported)
	if (message.editedAt && Math.abs(moment(message.editedAt).diff()) > 60000) {
		// TODO: Review as I am not sure how else to get around this as the incrementing of the msgs count shouldn't be in this callback
		RocketChat.models.Rooms.incMsgCountById(message.rid, 1);
		return message;
	} else if (message.editedAt) {

		// only updates last message if it was edited (skip rest of callback)
		if (RocketChat.settings.get('Store_Last_Message') && (!room.lastMessage || room.lastMessage._id === message._id)) {
			RocketChat.models.Rooms.setLastMessageById(message.rid, message);
		}
		return message;
	}

	if (message.ts && Math.abs(moment(message.ts).diff()) > 60000) {
		RocketChat.models.Rooms.incMsgCountById(message.rid, 1);
		return message;
	}

	if (room != null) {
		let toAll = false;
		let toHere = false;
		const mentionIds = [];
		const highlightsIds = [];
		const highlights = RocketChat.models.Subscriptions.findByRoomWithUserHighlights(room._id, { fields: { userHighlights: 1, 'u._id': 1 } }).fetch();
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
			const unreadCountDM = RocketChat.settings.get('Unread_Count_DM');

			if (unreadCountDM === 'all_messages') {
				RocketChat.models.Subscriptions.incUnreadForRoomIdExcludingUserId(room._id, message.u._id);
			} else if (toAll || toHere) {
				RocketChat.models.Subscriptions.incGroupMentionsAndUnreadForRoomIdExcludingUserId(room._id, message.u._id, 1, 1);
			} else if ((mentionIds && mentionIds.length > 0) || (highlightsIds && highlightsIds.length > 0)) {
				RocketChat.models.Subscriptions.incUserMentionsAndUnreadForRoomIdAndUserIds(room._id, _.compact(_.unique(mentionIds.concat(highlightsIds))), 1, 1);
			}
		} else {
			const unreadCount = RocketChat.settings.get('Unread_Count');

			if (toAll || toHere) {
				let incUnread = 0;
				if (['all_messages', 'group_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount)) {
					incUnread = 1;
				}
				RocketChat.models.Subscriptions.incGroupMentionsAndUnreadForRoomIdExcludingUserId(room._id, message.u._id, 1, incUnread);

			} else if ((mentionIds && mentionIds.length > 0) || (highlightsIds && highlightsIds.length > 0)) {
				let incUnread = 0;
				if (['all_messages', 'user_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount)) {
					incUnread = 1;
				}
				RocketChat.models.Subscriptions.incUserMentionsAndUnreadForRoomIdAndUserIds(room._id, _.compact(_.unique(mentionIds.concat(highlightsIds))), 1, incUnread);
			} else if (unreadCount === 'all_messages') {
				RocketChat.models.Subscriptions.incUnreadForRoomIdExcludingUserId(room._id, message.u._id);
			}
		}
	}

	// Update all the room activity tracker fields
	// This method take so long to execute on gient rooms cuz it will trugger the cache rebuild for the releations of that room
	RocketChat.models.Rooms.incMsgCountAndSetLastMessageById(message.rid, 1, message.ts, RocketChat.settings.get('Store_Last_Message') && message);
	// Update all other subscriptions to alert their owners but witout incrementing
	// the unread counter, as it is only for mentions and direct messages
	// We now set alert and open properties in two separate update commands. This proved to be more efficient on MongoDB - because it uses a more efficient index.
	RocketChat.models.Subscriptions.setAlertForRoomIdExcludingUserId(message.rid, message.u._id);
	RocketChat.models.Subscriptions.setOpenForRoomIdExcludingUserId(message.rid, message.u._id);

	return message;
}

RocketChat.callbacks.add('afterSaveMessage', notifyUsersOnMessage, RocketChat.callbacks.priority.LOW, 'notifyUsersOnMessage');
