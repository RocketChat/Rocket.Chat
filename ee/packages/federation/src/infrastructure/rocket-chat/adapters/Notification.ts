// import { Rooms } from '@rocket.chat/models';
import { api } from '@rocket.chat/core-services';

// import notifications from '../../../../../../app/notifications/server/lib/Notifications';
// import { i18n } from '../../../../../lib/i18n';

export class RocketChatNotificationAdapter {
	public async notifyUserTypingOnRoom(_internalRoomId: string, _username: string, _isTyping: boolean): Promise<void> {
		// notifications.notifyRoom(internalRoomId, 'user-activity', username, isTyping ? ['user-typing'] : []);
	}

	public async subscribeToUserTypingEventsOnFederatedRooms(
		_callback: (username: string, activity: string[], roomId: string) => void,
	): Promise<void> {
		// await Rooms.findFederatedRooms({ projection: { _id: 1 } }).forEach((room) =>
		// 	this.subscribeToUserTypingEventsOnFederatedRoomId(room._id, callback),
		// );
	}

	public subscribeToUserTypingEventsOnFederatedRoomId(
		_roomId: string,
		_callback: (username: string, activity: string[], roomId: string) => void,
	): void {
		// notifications.streamRoom.on(`${roomId}/user-activity`, (username, activity) => {
		// 	if (Array.isArray(activity) && (!activity.length || activity.includes('user-typing'))) {
		// 		callback(username, activity, roomId);
		// 	}
		// });
	}

	public async broadcastUserTypingOnRoom(username: string, activity: string[], roomId: string): Promise<void> {
		void api.broadcast('user.typing', {
			user: { username },
			isTyping: activity.includes('user-typing'),
			roomId,
		});
	}

	public notifyWithEphemeralMessage(_i18nMessageKey: string, _userId: string, _roomId: string, _language = 'en'): void {
		// void api.broadcast('notify.ephemeralMessage', userId, roomId, {
		// 	msg: i18n.t(i18nMessageKey, {
		// 		postProcess: 'sprintf',
		// 		lng: language,
		// 	}),
		// });
	}
}
