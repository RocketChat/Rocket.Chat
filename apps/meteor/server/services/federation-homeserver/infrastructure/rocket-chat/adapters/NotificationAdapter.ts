import { api } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Notifications } from '../../../app/notifications/server';

export class NotificationAdapter {
	constructor(private homeserverDomain: string) {}

	// Notify users about a new message
	async notifyUsersAboutMessage(
		message: { _id: string; rid: string; msg: string; u: { _id: string; username: string } },
		room: IRoom,
	): Promise<void> {
		// Broadcast message to room subscribers
		void api.broadcast('message.sent', {
			message: {
				_id: message._id,
				rid: message.rid,
				msg: message.msg,
				ts: new Date(),
				u: message.u,
			},
			room,
		});
	}

	// Broadcast user typing status
	async broadcastUserTyping(
		roomId: string,
		userId: string,
		username: string,
		isTyping: boolean,
	): Promise<void> {
		const eventName = isTyping ? 'typing' : 'typing-stopped';
		
		// Use Notifications to broadcast typing status
		Notifications.notifyRoom(roomId, eventName, {
			_id: userId,
			username,
			typing: isTyping,
		});
	}

	// Notify about room events
	async notifyRoomEvent(
		roomId: string,
		eventType: 'user-joined' | 'user-left' | 'room-updated',
		data: any,
	): Promise<void> {
		void api.broadcast(`room.${eventType}`, {
			roomId,
			...data,
		});
	}

	// Notify about user updates
	async notifyUserUpdate(
		userId: string,
		updateType: 'profile' | 'avatar' | 'status',
		data: any,
	): Promise<void> {
		void api.broadcast(`user.${updateType}`, {
			userId,
			...data,
		});
	}

	// Notify user typing (for homeserver bridge)
	async notifyUserTyping(
		userId: string,
		roomId: string,
		isTyping: boolean,
	): Promise<void> {
		// This would be used by the bridge to handle typing events from homeserver
		// For now, we'll just log it
		console.log('[NotificationAdapter] User typing notification:', userId, roomId, isTyping);
		
		// In a real implementation, this would translate the external user ID
		// and call broadcastUserTyping with the appropriate data
	}
}