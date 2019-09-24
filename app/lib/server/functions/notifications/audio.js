import { metrics } from '../../../../metrics';
import { settings } from '../../../../settings';
import { Notifications } from '../../../../notifications';

export function shouldNotifyAudio({
	disableAllMessageNotifications,
	status,
	statusConnection,
	audioNotifications,
	hasMentionToAll,
	hasMentionToHere,
	isHighlighted,
	hasMentionToUser,
	hasReplyToThread,
	roomType,
}) {
	if (disableAllMessageNotifications && audioNotifications == null && !hasReplyToThread) {
		return false;
	}

	if (statusConnection === 'offline' || status === 'busy' || audioNotifications === 'nothing') {
		return false;
	}

	if (!audioNotifications && settings.get('Accounts_Default_User_Preferences_audioNotifications') === 'all') {
		return true;
	}

	return roomType === 'd' || (!disableAllMessageNotifications && (hasMentionToAll || hasMentionToHere)) || isHighlighted || audioNotifications === 'all' || hasMentionToUser || hasReplyToThread;
}

export function notifyAudioUser(userId, message, room) {
	metrics.notificationsSent.inc({ notification_type: 'audio' });
	Notifications.notifyUser(userId, 'audioNotification', {
		payload: {
			_id: message._id,
			rid: message.rid,
			sender: message.u,
			type: room.t,
			name: room.name,
		},
	});
}
