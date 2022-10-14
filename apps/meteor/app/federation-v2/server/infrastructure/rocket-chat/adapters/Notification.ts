import notifications from '../../../../../notifications/server/lib/Notifications';

export class RocketChatNotificationAdapter {
	public async notifyUserTypingOnRoom(internalRoomId: string, username: string, isTyping: boolean): Promise<void> {
		notifications.notifyRoom(internalRoomId, 'user-activity', username, isTyping ? ['user-typing'] : []);
	}
}
