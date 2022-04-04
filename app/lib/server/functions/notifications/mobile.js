import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { settings } from '../../../../settings';
import { Subscriptions } from '../../../../models/server/raw';
import { roomCoordinator } from '../../../../../server/lib/rooms/roomCoordinator';

const CATEGORY_MESSAGE = 'MESSAGE';
const CATEGORY_MESSAGE_NOREPLY = 'MESSAGE_NOREPLY';

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

export async function getPushData({
	room,
	message,
	userId,
	senderUsername,
	senderName,
	notificationMessage,
	receiver,
	shouldOmitMessage = true,
}) {
	const username = settings.get('Push_show_username_room') ? (settings.get('UI_Use_Real_Name') && senderName) || senderUsername : '';

	const lng = receiver.language || settings.get('Language') || 'en';

	let messageText;
	if (shouldOmitMessage && settings.get('Push_request_content_from_server')) {
		messageText = TAPi18n.__('You_have_a_new_message', { lng });
	} else if (!settings.get('Push_show_message')) {
		messageText = TAPi18n.__('You_have_a_new_message', { lng });
	} else {
		messageText = notificationMessage;
	}

	return {
		payload: {
			sender: message.u,
			senderName: username,
			type: room.t,
			name: settings.get('Push_show_username_room') ? room.name : '',
			messageType: message.t,
			tmid: message.tmid,
			...(message.t === 'e2e' && { msg: message.msg }),
		},
		roomName:
			settings.get('Push_show_username_room') && roomCoordinator.getRoomDirectives(room.t)?.isGroupChat(room)
				? `#${roomCoordinator.getRoomName(room.t, room, userId)}`
				: '',
		username,
		message: messageText,
		badge: await Subscriptions.getBadgeCount(userId),
		category: enableNotificationReplyButton(room, receiver.username) ? CATEGORY_MESSAGE : CATEGORY_MESSAGE_NOREPLY,
	};
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
	if (settings.get('Push_enable') !== true) {
		return false;
	}

	if (disableAllMessageNotifications && mobilePushNotifications == null && !isHighlighted && !hasMentionToUser && !hasReplyToThread) {
		return false;
	}

	if (mobilePushNotifications === 'nothing') {
		return false;
	}

	if (!mobilePushNotifications) {
		if (settings.get('Accounts_Default_User_Preferences_pushNotifications') === 'all' && (!isThread || hasReplyToThread)) {
			return true;
		}
		if (settings.get('Accounts_Default_User_Preferences_pushNotifications') === 'nothing') {
			return false;
		}
	}

	return (
		(roomType === 'd' ||
			(!disableAllMessageNotifications && hasMentionToAll) ||
			isHighlighted ||
			mobilePushNotifications === 'all' ||
			hasMentionToUser) &&
		(!isThread || hasReplyToThread)
	);
}
