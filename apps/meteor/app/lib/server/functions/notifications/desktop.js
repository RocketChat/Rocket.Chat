import { roomCoordinator } from '../../../../../server/lib/rooms/roomCoordinator';
import { api } from '../../../../../server/sdk/api';
import { metrics } from '../../../../metrics/server';
import { settings } from '../../../../settings/server';

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
export function notifyDesktopUser({ userId, user, message, room, duration, notificationMessage }) {
	const { title, text } = roomCoordinator.getRoomDirectives(room.t)?.getNotificationDetails(room, user, notificationMessage, userId);

	const payload = {
		title,
		text,
		duration,
		payload: {
			_id: message._id,
			rid: message.rid,
			tmid: message.tmid,
			sender: message.u,
			type: room.t,
			name: room.name,
			message: {
				msg: message.msg,
				t: message.t,
			},
		},
	};

	metrics.notificationsSent.inc({ notification_type: 'desktop' });

	api.broadcast('notify.desktop', userId, payload);
}

export function shouldNotifyDesktop({
	disableAllMessageNotifications,
	status,
	statusConnection,
	desktopNotifications,
	hasMentionToAll,
	hasMentionToHere,
	isHighlighted,
	hasMentionToUser,
	hasReplyToThread,
	roomType,
	isThread,
}) {
	if (disableAllMessageNotifications && desktopNotifications == null && !isHighlighted && !hasMentionToUser && !hasReplyToThread) {
		return false;
	}

	if (statusConnection === 'offline' || status === 'busy' || desktopNotifications === 'nothing') {
		return false;
	}

	if (!desktopNotifications) {
		if (settings.get('Accounts_Default_User_Preferences_desktopNotifications') === 'all' && (!isThread || hasReplyToThread)) {
			return true;
		}
		if (settings.get('Accounts_Default_User_Preferences_desktopNotifications') === 'nothing') {
			return false;
		}
	}

	return (
		(roomType === 'd' ||
			(!disableAllMessageNotifications && (hasMentionToAll || hasMentionToHere)) ||
			isHighlighted ||
			desktopNotifications === 'all' ||
			hasMentionToUser) &&
		(!isThread || hasReplyToThread)
	);
}
