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
function messageContainsHighlight(message, highlights) {
	if (! highlights || highlights.length === 0) { return false; }

	let has = false;
	highlights.some(function(highlight) {
		const regexp = new RegExp(s.escapeRegExp(highlight), 'i');
		if (regexp.test(message.msg)) {
			has = true;
			return true;
		}
	});

	return has;
}

function notifyUsersOnMessage(message, room) {
	// skips this callback if the message was edited and increments it if the edit was way in the past (aka imported)
	if (message.editedAt && Math.abs(moment(message.editedAt).diff()) > 60000) {
		//TODO: Review as I am not sure how else to get around this as the incrementing of the msgs count shouldn't be in this callback
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
		const highlights = RocketChat.models.Users.findUsersByUsernamesWithHighlights(room.usernames, { fields: { '_id': 1, 'settings.preferences.highlights': 1 }}).fetch();

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

		highlights.forEach(function(user) {
			const userHighlights = RocketChat.getUserPreference(user, 'highlights');
			if (userHighlights && messageContainsHighlight(message, userHighlights)) {
				if (user._id !== message.u._id) {
					highlightsIds.push(user._id);
				}
			}
		});

		if (room.t === 'd') {
			const unreadCountDM = RocketChat.settings.get('Unread_Count_DM');

			if (unreadCountDM === 'all_messages') {
				console.time('incUnreadForRoomIdExcludingUserId');
				RocketChat.models.Subscriptions.incUnreadForRoomIdExcludingUserId(room._id, message.u._id);
				console.timeEnd('incUnreadForRoomIdExcludingUserId');
			} else if (toAll || toHere) {
				console.time('incGroupMentionsAndUnreadForRoomIdExcludingUserId1');
				RocketChat.models.Subscriptions.incGroupMentionsAndUnreadForRoomIdExcludingUserId(room._id, message.u._id, 1, 1);
				console.timeEnd('incGroupMentionsAndUnreadForRoomIdExcludingUserId1');
			} else if ((mentionIds && mentionIds.length > 0) || (highlightsIds && highlightsIds.length > 0)) {
				console.time('incUserMentionsAndUnreadForRoomIdAndUserIds');
				RocketChat.models.Subscriptions.incUserMentionsAndUnreadForRoomIdAndUserIds(room._id, _.compact(_.unique(mentionIds.concat(highlightsIds))), 1, 1);
				console.timeEnd('incUserMentionsAndUnreadForRoomIdAndUserIds');
			}
		} else {
			const unreadCount = RocketChat.settings.get('Unread_Count');

			if (toAll || toHere) {
				let incUnread = 0;
				if (['all_messages', 'group_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount)) {
					incUnread = 1;
				}
				console.time('incGroupMentionsAndUnreadForRoomIdExcludingUserId2');
				RocketChat.models.Subscriptions.incGroupMentionsAndUnreadForRoomIdExcludingUserId(room._id, message.u._id, 1, incUnread);
				console.timeEnd('incGroupMentionsAndUnreadForRoomIdExcludingUserId2');

			} else if ((mentionIds && mentionIds.length > 0) || (highlightsIds && highlightsIds.length > 0)) {
				let incUnread = 0;
				if (['all_messages', 'user_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount)) {
					incUnread = 1;
				}
				console.time('incUserMentionsAndUnreadForRoomIdAndUserIds');
				RocketChat.models.Subscriptions.incUserMentionsAndUnreadForRoomIdAndUserIds(room._id, _.compact(_.unique(mentionIds.concat(highlightsIds))), 1, incUnread);
				console.timeEnd('incUserMentionsAndUnreadForRoomIdAndUserIds');
			} else if (unreadCount === 'all_messages') {
				console.time('incUnreadForRoomIdExcludingUserId');
				RocketChat.models.Subscriptions.incUnreadForRoomIdExcludingUserId(room._id, message.u._id);
				console.timeEnd('incUnreadForRoomIdExcludingUserId');
			}
		}
	}

	// Update all the room activity tracker fields
	console.time('incMsgCountAndSetLastMessageById');
	RocketChat.models.Rooms.incMsgCountAndSetLastMessageById(message.rid, 1, message.ts, RocketChat.settings.get('Store_Last_Message') && message);
	console.timeEnd('incMsgCountAndSetLastMessageById');

	// Update all other subscriptions to alert their owners but witout incrementing
	// the unread counter, as it is only for mentions and direct messages
	console.time('setAlertForRoomIdExcludingUserId');
	RocketChat.models.Subscriptions.setAlertForRoomIdExcludingUserId(message.rid, message.u._id);
	RocketChat.models.Subscriptions.setOpenForRoomIdExcludingUserId(message.rid, message.u._id);
	console.timeEnd('setAlertForRoomIdExcludingUserId');

	return message;
}

RocketChat.callbacks.add('afterSaveMessage', notifyUsersOnMessage, RocketChat.callbacks.priority.LOW, 'notifyUsersOnMessage');
