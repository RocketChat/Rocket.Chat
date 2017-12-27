import _ from 'underscore';
import s from 'underscore.string';
import moment from 'moment';

RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	// skips this callback if the message was edited and increments it if the edit was way in the past (aka imported)
	if (message.editedAt && Math.abs(moment(message.editedAt).diff()) > 60000) {
		//TODO: Review as I am not sure how else to get around this as the incrementing of the msgs count shouldn't be in this callback
		RocketChat.models.Rooms.incMsgCountById(message.rid, 1);
		return message;
	} else if (message.editedAt) {
		// skips this callback if the message was edited
		return message;
	}

	if (message.ts && Math.abs(moment(message.ts).diff()) > 60000) {
		RocketChat.models.Rooms.incMsgCountById(message.rid, 1);
		return message;
	}

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
	RocketChat.models.Rooms.incMsgCountAndSetLastMessageById(message.rid, 1, message.ts, RocketChat.settings.get('Store_Last_Message') && message);

	// Update all other subscriptions to alert their owners but witout incrementing
	// the unread counter, as it is only for mentions and direct messages
	RocketChat.models.Subscriptions.setAlertForRoomIdExcludingUserId(message.rid, message.u._id);

	return message;

}, RocketChat.callbacks.priority.LOW, 'notifyUsersOnMessage');
