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

	// update last activity time
	RocketChat.models.Subscriptions.updateLastActivityTimeByRoomId(message.rid);

	if (room.t != null && room.t === 'd') {
		// Update the other subscriptions
		RocketChat.models.Subscriptions.incUnreadOfDirectForRoomIdExcludingUserId(message.rid, message.u._id, 1);
	} else {
		let toAll = false;
		const mentionIds = [];
		const highlightsIds = [];
		const highlights = RocketChat.models.Users.findUsersByUsernamesWithHighlights(room.usernames, { fields: { '_id': 1, 'settings.preferences.highlights': 1 }}).fetch();

		if (message.mentions != null) {
			message.mentions.forEach(function(mention) {
				if (!toAll && mention._id === 'all') {
					toAll = true;
				}
				if (mention._id !== message.u._id) {
					mentionIds.push(mention._id);
				}
			});
		}

		highlights.forEach(function(user) {
			if (user && user.settings && user.settings.preferences && messageContainsHighlight(message, user.settings.preferences.highlights)) {
				if (user._id !== message.u._id) {
					highlightsIds.push(user._id);
				}
			}
		});

		if (toAll) {
			RocketChat.models.Subscriptions.incUnreadForRoomIdExcludingUserId(room._id, message.u._id);
		} else if ((mentionIds && mentionIds.length > 0) || (highlightsIds && highlightsIds.length > 0)) {
			RocketChat.models.Subscriptions.incUnreadForRoomIdAndUserIds(room._id, _.compact(_.unique(mentionIds.concat(highlightsIds))));
		}
	}

	// Update all the room activity tracker fields
	RocketChat.models.Rooms.incMsgCountAndSetLastMessageTimestampById(message.rid, 1, message.ts);

	// Update all other subscriptions to alert their owners but witout incrementing
	// the unread counter, as it is only for mentions and direct messages
	RocketChat.models.Subscriptions.setAlertForRoomIdExcludingUserId(message.rid, message.u._id);

	return message;

}, RocketChat.callbacks.priority.LOW, 'notifyUsersOnMessage');
