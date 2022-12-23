import { Rooms } from '@rocket.chat/models';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { api } from '../../../../../../server/sdk/api';
import notifications from '../../../../../notifications/server/lib/Notifications';

export class RocketChatNotificationAdapter {
	public async notifyUserTypingOnRoom(internalRoomId: string, username: string, isTyping: boolean): Promise<void> {
		notifications.notifyRoom(internalRoomId, 'user-activity', username, isTyping ? ['user-typing'] : []);
	}

	public async subscribeToUserTypingEventsOnFederatedRooms(
		callback: (username: string, activity: string[], roomId: string) => void,
	): Promise<void> {
		await Rooms.findFederatedRooms({ projection: { _id: 1 } }).forEach((room) =>
			this.subscribeToUserTypingEventsOnFederatedRoomId(room._id, callback),
		);
	}

	public subscribeToUserTypingEventsOnFederatedRoomId(
		roomId: string,
		callback: (username: string, activity: string[], roomId: string) => void,
	): void {
		notifications.streamRoom.on(`${roomId}/user-activity`, (username, activity) => {
			if (Array.isArray(activity) && (!activity.length || activity.includes('user-typing'))) {
				callback(username, activity, roomId);
			}
		});
	}

	public async broadcastUserTypingOnRoom(username: string, activity: string[], roomId: string): Promise<void> {
		api.broadcast('user.typing', {
			user: { username },
			isTyping: activity.includes('user-typing'),
			roomId,
		});
	}

	public notifyWithEphemeralMessage(i18nMessageKey: string, userId: string, roomId: string, language = 'en'): void {
		api.broadcast('notify.ephemeralMessage', userId, roomId, {
			msg: TAPi18n.__(i18nMessageKey, {
				postProcess: 'sprintf',
				lng: language,
			}),
		});
	}
}
