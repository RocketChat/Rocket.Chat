/**
 * Send notification to user
 *
 * @param {string} userId The user to notify
 * @param {object} user The sender
 * @param {object} room The room send from
 * @param {object} message The message object
 * @param {number} duration Duration of notification
 * @param {string} notificationMessage The message text to send on notification body
 */
export function notifyDesktopUser({
	userId,
	user,
	message,
	room,
	duration,
	notificationMessage,
}) {
	const { title, text } = RocketChat.roomTypes.getConfig(room.t).getNotificationDetails(room, user, notificationMessage);

	RocketChat.metrics.notificationsSent.inc({ notification_type: 'desktop' });
	RocketChat.Notifications.notifyUser(userId, 'notification', {
		title,
		text,
		duration,
		payload: {
			_id: message._id,
			rid: message.rid,
			sender: message.u,
			type: room.t,
			name: room.name,
		},
	});
}

export function shouldNotifyDesktop({
	disableAllMessageNotifications,
	status,
	desktopNotifications,
	hasMentionToAll,
	hasMentionToHere,
	isHighlighted,
	hasMentionToUser,
	roomType,
}) {
	if (disableAllMessageNotifications && desktopNotifications == null) {
		return false;
	}

	if (status === 'busy' || desktopNotifications === 'nothing') {
		return false;
	}

	if (!desktopNotifications) {
		if (RocketChat.settings.get('Accounts_Default_User_Preferences_desktopNotifications') === 'all') {
			return true;
		}
		if (RocketChat.settings.get('Accounts_Default_User_Preferences_desktopNotifications') === 'nothing') {
			return false;
		}
	}

	return roomType === 'd' || (!disableAllMessageNotifications && (hasMentionToAll || hasMentionToHere)) || isHighlighted || desktopNotifications === 'all' || hasMentionToUser;
}
