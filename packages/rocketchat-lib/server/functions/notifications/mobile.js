import { Meteor } from 'meteor/meteor';

const CATEGORY_MESSAGE = 'MESSAGE';
const CATEGORY_MESSAGE_NOREPLY = 'MESSAGE_NOREPLY';

let alwaysNotifyMobileBoolean;
RocketChat.settings.get('Notifications_Always_Notify_Mobile', (key, value) => {
	alwaysNotifyMobileBoolean = value;
});

let SubscriptionRaw;
Meteor.startup(() => {
	SubscriptionRaw = RocketChat.models.Subscriptions.model.rawCollection();
});

async function getBadgeCount(userId) {
	const [result] = await SubscriptionRaw.aggregate([
		{ $match: { 'u._id': userId } },
		{
			$group: {
				_id: 'total',
				total: { $sum: '$unread' },
			},
		},
	]).toArray();

	const { total } = result;
	return total;
}

function canSendMessageToRoom(room, username) {
	return !((room.muted || []).includes(username));
}

export async function sendSinglePush({ room, message, userId, receiverUsername, senderUsername, senderName, notificationMessage }) {
	let username = '';
	if (RocketChat.settings.get('Push_show_username_room')) {
		username = RocketChat.settings.get('UI_Use_Real_Name') === true ? senderName : senderUsername;
	}

	RocketChat.PushNotification.send({
		roomId: message.rid,
		payload: {
			host: Meteor.absoluteUrl(),
			rid: message.rid,
			sender: message.u,
			type: room.t,
			name: room.name,
			messageType: message.t,
			messageId: message._id,
		},
		roomName: RocketChat.settings.get('Push_show_username_room') && room.t !== 'd' ? `#${ RocketChat.roomTypes.getRoomName(room.t, room) }` : '',
		username,
		message: RocketChat.settings.get('Push_show_message') ? notificationMessage : ' ',
		badge: await getBadgeCount(userId),
		usersTo: {
			userId,
		},
		category: canSendMessageToRoom(room, receiverUsername) ? CATEGORY_MESSAGE : CATEGORY_MESSAGE_NOREPLY,
	});
}

export function shouldNotifyMobile({
	disableAllMessageNotifications,
	mobilePushNotifications,
	hasMentionToAll,
	isHighlighted,
	hasMentionToUser,
	statusConnection,
	roomType,
}) {
	if (disableAllMessageNotifications && mobilePushNotifications == null && !isHighlighted && !hasMentionToUser) {
		return false;
	}

	if (mobilePushNotifications === 'nothing') {
		return false;
	}

	if (!alwaysNotifyMobileBoolean && statusConnection === 'online') {
		return false;
	}

	if (!mobilePushNotifications) {
		if (RocketChat.settings.get('Accounts_Default_User_Preferences_mobileNotifications') === 'all') {
			return true;
		}
		if (RocketChat.settings.get('Accounts_Default_User_Preferences_mobileNotifications') === 'nothing') {
			return false;
		}
	}

	return roomType === 'd' || (!disableAllMessageNotifications && hasMentionToAll) || isHighlighted || mobilePushNotifications === 'all' || hasMentionToUser;
}
