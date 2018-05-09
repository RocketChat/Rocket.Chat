export function shouldNotifyAudio({
	disableAllMessageNotifications,
	status,
	audioNotifications,
	hasMentionToAll,
	hasMentionToHere,
	isHighlighted,
	hasMentionToUser
}) {
	if (disableAllMessageNotifications && audioNotifications == null) {
		return false;
	}

	if (status === 'busy' || audioNotifications === 'nothing') {
		return false;
	}

	if (!audioNotifications && RocketChat.settings.get('Accounts_Default_User_Preferences_audioNotifications') === 'all') {
		return true;
	}

	return (!disableAllMessageNotifications && (hasMentionToAll || hasMentionToHere)) || isHighlighted || audioNotifications === 'all' || hasMentionToUser;
}

export function notifyAudioUser(userId, message, room) {
	RocketChat.Notifications.notifyUser(userId, 'audioNotification', {
		payload: {
			_id: message._id,
			rid: message.rid,
			sender: message.u,
			type: room.t,
			name: room.name
		}
	});
}
