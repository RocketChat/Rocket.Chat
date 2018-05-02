import { parseMessageText } from './index';

const CATEGORY_MESSAGE = 'MESSAGE';
const CATEGORY_MESSAGE_NOREPLY = 'MESSAGE_NOREPLY';

let alwaysNotifyMobileBoolean;

Meteor.startup(() => {
	alwaysNotifyMobileBoolean = RocketChat.settings.get('Notifications_Always_Notify_Mobile');
});

// function getBadgeCount(userId) {
// 	const subscriptions = RocketChat.models.Subscriptions.findUnreadByUserId(userId).fetch();

// 	return subscriptions.reduce((unread, sub) => {
// 		return sub.unread + unread;
// 	}, 0);
// }

function canSendMessageToRoom(room, username) {
	return !((room.muted || []).includes(username));
}

export function sendSinglePush({ room, message, userId, receiverUsername, senderUsername }) {
	RocketChat.PushNotification.send({
		roomId: message.rid,
		// badge: getBadgeCount(userIdToNotify),
		payload: {
			host: Meteor.absoluteUrl(),
			rid: message.rid,
			sender: message.u,
			type: room.t,
			name: room.name
		},
		roomName: RocketChat.settings.get('Push_show_username_room') ? `#${ RocketChat.roomTypes.getRoomName(room.t, room) }` : '',
		username: RocketChat.settings.get('Push_show_username_room') ? senderUsername : '',
		message: RocketChat.settings.get('Push_show_message') ? parseMessageText(message, userId) : ' ',
		// badge: getBadgeCount(userIdToNotify),
		usersTo: {
			userId
		},
		category: canSendMessageToRoom(room, receiverUsername) ? CATEGORY_MESSAGE : CATEGORY_MESSAGE_NOREPLY
	});
}

export function shouldNotifyMobile({ disableAllMessageNotifications, mobilePushNotifications, toAll, isHighlighted, isMentioned, statusConnection }) {
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
