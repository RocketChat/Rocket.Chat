import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { settings } from '../../../../settings';
import { Subscriptions, PushNotificationSubscriptions } from '../../../../models';
import { roomTypes } from '../../../../utils';

const CATEGORY_MESSAGE = 'MESSAGE';
const CATEGORY_MESSAGE_NOREPLY = 'MESSAGE_NOREPLY';
const webpush = require('web-push');

let SubscriptionRaw;
Meteor.startup(() => {
	SubscriptionRaw = Subscriptions.model.rawCollection();
});

async function getBadgeCount(userId) {
	const [result = {}] = await SubscriptionRaw.aggregate([
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

function enableNotificationReplyButton(room, username) {
	// Some users may have permission to send messages even on readonly rooms, but we're ok with false negatives here in exchange of better perfomance
	if (room.ro === true) {
		return false;
	}

	if (!room.muted) {
		return true;
	}

	return !room.muted.includes(username);
}

export async function getPushData({ room, message, userId, senderUsername, senderName, notificationMessage, receiver, shouldOmitMessage = true }) {
	const username = (settings.get('Push_show_username_room') && settings.get('UI_Use_Real_Name') && senderName) || senderUsername;

	const lng = receiver.language || settings.get('Language') || 'en';

	let messageText;
	if (shouldOmitMessage && settings.get('Push_request_content_from_server')) {
		messageText = TAPi18n.__('You_have_a_new_message', { lng });
	} else if (!settings.get('Push_show_message')) {
		messageText = ' ';
	} else {
		messageText = notificationMessage;
	}

	return {
		payload: {
			sender: message.u,
			type: room.t,
			name: room.name,
			messageType: message.t,
			tmid: message.tmid,
		},
		roomName: settings.get('Push_show_username_room') && roomTypes.getConfig(room.t).isGroupChat(room) ? `#${ roomTypes.getRoomName(room.t, room) }` : '',
		username,
		message: messageText,
		badge: await getBadgeCount(userId),
		category: enableNotificationReplyButton(room, receiver.username) ? CATEGORY_MESSAGE : CATEGORY_MESSAGE_NOREPLY,
	};
}

export function sendWebPush({ room, message, userId, receiverUsername, senderUsername, senderName, notificationMessage }) {
	const gcmKey = settings.get('Push_gcm_api_key');
	const vapidPublic = settings.get('Vapid_public_key');
	const vapidPrivate = settings.get('Vapid_private_key');
	const vapidSubject = settings.get('Vapid_subject');

	webpush.setGCMAPIKey(gcmKey);
	webpush.setVapidDetails(
		vapidSubject,
		vapidPublic,
		vapidPrivate,
	);

	const pushSubscriptions = PushNotificationSubscriptions.findByUserId(userId);
	const options = {
		TTL: 3600,
	};
	const title = room.t === 'd' ? message.u.name : room.name;
	const displayMessage = room.t === 'd' ? notificationMessage : `${ message.u.name }: ${ notificationMessage }`;

	let redirectURL;
	if (room.t === 'd') {
		redirectURL = '/direct/';
	} else if (room.t === 'p') {
		redirectURL = '/group/';
	} else if (room.t === 'c') {
		redirectURL = '/channel/';
	}
	redirectURL += message.rid;

	const payload = {
		host: Meteor.absoluteUrl(),
		title,
		message: displayMessage,
		receiverUsername,
		senderUsername,
		senderName,
		redirectURL,
		vibrate: [100, 50, 100],
		icon: '/images/icons/icon-72x72.png',
	};
	const stringifiedPayload = JSON.stringify(payload);

	pushSubscriptions.forEach((pushSubscription) => {
		webpush.sendNotification(pushSubscription, stringifiedPayload, options)
			.catch((error) => {
				if (error.statusCode === 410) {
					PushNotificationSubscriptions.removeById(pushSubscription._id);
				}
			});
	});
}

export function shouldNotifyMobile({
	disableAllMessageNotifications,
	mobilePushNotifications,
	hasMentionToAll,
	isHighlighted,
	hasMentionToUser,
	hasReplyToThread,
	roomType,
	isThread,
}) {
	if (disableAllMessageNotifications && mobilePushNotifications == null && !isHighlighted && !hasMentionToUser && !hasReplyToThread) {
		return false;
	}

	if (mobilePushNotifications === 'nothing') {
		return false;
	}

	if (!mobilePushNotifications) {
		if (settings.get('Accounts_Default_User_Preferences_mobileNotifications') === 'all' && (!isThread || hasReplyToThread)) {
			return true;
		}
		if (settings.get('Accounts_Default_User_Preferences_mobileNotifications') === 'nothing') {
			return false;
		}
	}

	return (roomType === 'd' || (!disableAllMessageNotifications && hasMentionToAll) || isHighlighted || mobilePushNotifications === 'all' || hasMentionToUser) && (!isThread || hasReplyToThread);
}
