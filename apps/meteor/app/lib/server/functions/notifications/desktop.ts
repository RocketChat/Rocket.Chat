import { api } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IUser, AtLeast } from '@rocket.chat/core-typings';

import { roomCoordinator } from '../../../../../server/lib/rooms/roomCoordinator';
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
export async function notifyDesktopUser({
	userId,
	user,
	message,
	room,
	duration,
	notificationMessage,
}: {
	userId: string;
	user: AtLeast<IUser, '_id' | 'name' | 'username'>;
	message: IMessage | Pick<IMessage, 'u'>;
	room: IRoom;
	duration?: number;
	notificationMessage: string;
}): Promise<void> {
	const { title, text, name } = await roomCoordinator
		.getRoomDirectives(room.t)
		.getNotificationDetails(room, user, notificationMessage, userId);

	const payload = {
		title: title || '',
		text,
		duration,
		payload: {
			_id: '',
			rid: '',
			tmid: '',
			...('_id' in message && {
				// TODO: omnichannel is not sending _id, rid, tmid
				_id: message._id,
				rid: message.rid,
				tmid: message.tmid,
			}),
			sender: message.u,
			type: room.t,
			message: {
				msg: 'msg' in message ? message.msg : '',
				...('t' in message && {
					t: message.t,
				}),
			},
			name,
		},
	};

	metrics.notificationsSent.inc({ notification_type: 'desktop' });

	void api.broadcast('notify.desktop', userId, payload);
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
}: {
	disableAllMessageNotifications: boolean;
	status: string;
	statusConnection: string;
	desktopNotifications: string;
	hasMentionToAll: boolean;
	hasMentionToHere: boolean;
	isHighlighted: boolean;
	hasMentionToUser: boolean;
	hasReplyToThread: boolean;
	roomType: string;
	isThread: boolean;
}): boolean {
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
		(isHighlighted || !isThread || hasReplyToThread)
	);
}
