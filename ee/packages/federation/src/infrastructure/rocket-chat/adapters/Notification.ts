import { api } from '@rocket.chat/core-services';
import { Rooms } from '@rocket.chat/models';

import { i18n } from './i18n';

export class RocketChatNotificationAdapter {
	public async notifyUserTypingOnRoom(internalRoomId: string, username: string, isTyping: boolean): Promise<void> {
		await api.broadcast('federated-user.typing', { user: { username }, isTyping, roomId: internalRoomId });
	}

	public async subscribeToUserTypingEventsOnFederatedRooms(): Promise<void> {
		await Rooms.findFederatedRooms({ projection: { _id: 1 } }).forEach((room) =>
			this.subscribeToUserTypingEventsOnFederatedRoomId(room._id),
		);
	}

	public subscribeToUserTypingEventsOnFederatedRoomId(roomId: string): void {
		void api.broadcast('federated-room.listen-typing-events', roomId);
	}

	public async broadcastUserTypingOnRoom(username: string, activity: string[], roomId: string): Promise<void> {
		void api.broadcast('user.typing', {
			user: { username },
			isTyping: activity.includes('user-typing'),
			roomId,
		});
	}

	public notifyWithEphemeralMessage(i18nMessageKey: string, userId: string, roomId: string, language = 'en'): void {
		void api.broadcast('notify.ephemeralMessage', userId, roomId, {
			msg: i18n.t(i18nMessageKey, {
				postProcess: 'sprintf',
				lng: language,
			}),
		});
	}
}
