export function shouldNotifyAudio({
	disableAllMessageNotifications,
	status,
	statusConnection,
	audioNotifications,
	hasMentionToAll,
	hasMentionToHere,
	isHighlighted,
	hasMentionToUser,
	roomType,
}) {
	if (disableAllMessageNotifications && audioNotifications == null) {
		return false;
	}

	if (statusConnection === 'offline' || status === 'busy' || audioNotifications === 'nothing') {
		return false;
	}

	if (!audioNotifications && RocketChat.settings.get('Accounts_Default_User_Preferences_audioNotifications') === 'all') {
		return true;
	}

	return roomType === 'd' || (!disableAllMessageNotifications && (hasMentionToAll || hasMentionToHere)) || isHighlighted || audioNotifications === 'all' || hasMentionToUser;
}

export function notifyAudioUser(userId, message, room) {
	RocketChat.metrics.notificationsSent.inc({ notification_type: 'audio' });
	RocketChat.Notifications.notifyUser(userId, 'audioNotification', {
		payload: {
			_id: message._id,
			rid: message.rid,
			sender: message.u,
			type: room.t,
			name: room.name,
		},
	});
}
