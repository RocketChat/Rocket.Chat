import { Rooms } from '@rocket.chat/models';
import { Translation, api } from '@rocket.chat/core-services';

import notifications from '../../../../../../app/notifications/server/lib/Notifications';

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
		void api.broadcast('user.typing', {
			user: { username },
			isTyping: activity.includes('user-typing'),
			roomId,
		});
	}

	public async notifyWithEphemeralMessage(i18nMessageKey: string, userId: string, roomId: string, language = 'en'): Promise<void> {
		void api.broadcast('notify.ephemeralMessage', userId, roomId, {
			msg: await Translation.translateText(i18nMessageKey, language),
		});
	}
}
