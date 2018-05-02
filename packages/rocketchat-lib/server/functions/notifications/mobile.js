const CATEGORY_MESSAGE = 'MESSAGE';
const CATEGORY_MESSAGE_NOREPLY = 'MESSAGE_NOREPLY';

// function getBadgeCount(userId) {
// 	const subscriptions = RocketChat.models.Subscriptions.findUnreadByUserId(userId).fetch();

// 	return subscriptions.reduce((unread, sub) => {
// 		return sub.unread + unread;
// 	}, 0);
// }

function canSendMessageToRoom(room, username) {
	return !((room.muted || []).includes(username));
}

export function sendSinglePush({ room, roomId, roomName, username, message, payload, userId, receiverUsername}) {
	RocketChat.PushNotification.send({
		roomId,
		roomName,
		username,
		message,
		// badge: getBadgeCount(userIdToNotify),
		payload,
		usersTo: {
			userId
		},
		category: canSendMessageToRoom(room, receiverUsername) ? CATEGORY_MESSAGE : CATEGORY_MESSAGE_NOREPLY
	});
}

export function shouldNotifyMobile({ disableAllMessageNotifications, mobilePushNotifications, toAll, isHighlighted, isMentioned, alwaysNotifyMobileBoolean, statusConnection }) {
	if (disableAllMessageNotifications && mobilePushNotifications == null) {
		return false;
	}

	if (mobilePushNotifications === 'nothing') {
		return false;
	}

	if (!alwaysNotifyMobileBoolean && statusConnection === 'online') {
		return false;
	}

	return toAll || isHighlighted || mobilePushNotifications === 'all' || isMentioned;
}
