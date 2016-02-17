RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}
	if (room.t != null && room.t === 'd') {
		// Update the other subscriptions
		RocketChat.models.Subscriptions.incUnreadOfDirectForRoomIdExcludingUserId(message.rid, message.u._id, 1);
	} else {
		var mentionIds = [];
		var toAll = false;
		if (message.mentions != null) {
			message.mentions.forEach(function(mention) {
				if (!toAll && mention._id === 'all') {
					toAll = true;
				}
				mentionIds.push(mention._id);
			});
		}

		if (toAll) {
			RocketChat.models.Subscriptions.incUnreadForRoomIdExcludingUserId(room._id, message.u._id);
		} else if (mentionIds.length > 0) {
			RocketChat.models.Subscriptions.incUnreadForRoomIdAndUserIds(room._id, mentionIds);
		}
	}

	// Update all the room activity tracker fields
	RocketChat.models.Rooms.incMsgCountAndSetLastMessageTimestampById(message.rid, 1, message.ts);

	// Update all other subscriptions to alert their owners but witout incrementing
	// the unread counter, as it is only for mentions and direct messages
	RocketChat.models.Subscriptions.setAlertForRoomIdExcludingUserId(message.rid, message.u._id, true);

	return message;

}, RocketChat.callbacks.priority.LOW);
