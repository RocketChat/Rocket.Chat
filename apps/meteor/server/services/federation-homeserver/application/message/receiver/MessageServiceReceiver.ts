import type { HomeserverMessage, IHomeserverConfig } from '@rocket.chat/core-services';
import { AbstractHomeserverApplicationService } from '../../AbstractHomeserverApplicationService';
import type { IMessageServiceReceiver } from '../../../infrastructure/homeserver/handlers/MessageHandler';

export interface IHomeserverRoomAdapter {
	getRoomByExternalId(externalId: string): Promise<{ _id: string } | null>;
	isUserMemberOfRoom(userId: string, roomId: string): Promise<boolean>;
}

export interface IHomeserverUserAdapter {
	getUserByExternalId(externalId: string): Promise<{ _id: string; username: string } | null>;
	createFederatedUser(externalId: string, username: string, displayName?: string): Promise<{ _id: string; username: string }>;
}

export interface IHomeserverMessageAdapter {
	createMessage(message: {
		rid: string;
		msg: string;
		u: { _id: string; username: string };
		federation?: { eventId: string };
	}): Promise<string>;
	updateMessage(messageId: string, newContent: string): Promise<void>;
	deleteMessage(messageId: string): Promise<void>;
	getMessageByExternalId(externalId: string): Promise<{ _id: string } | null>;
}

export class MessageServiceReceiver extends AbstractHomeserverApplicationService implements IMessageServiceReceiver {
	constructor(
		homeserverConfig: IHomeserverConfig,
		private roomAdapter: IHomeserverRoomAdapter,
		private userAdapter: IHomeserverUserAdapter,
		private messageAdapter: IHomeserverMessageAdapter,
	) {
		super(homeserverConfig);
	}

	public async onExternalMessageReceived(message: HomeserverMessage): Promise<void> {
		console.log('[MessageServiceReceiver] Processing external message:', message.id);

		try {
			// 1. Validate room exists
			const room = await this.roomAdapter.getRoomByExternalId(message.roomId);
			if (!room) {
				console.warn('[MessageServiceReceiver] Room not found:', message.roomId);
				return;
			}

			// 2. Get or create user
			let user = await this.userAdapter.getUserByExternalId(message.userId);
			if (!user) {
				// Extract username from external ID (format: @username:domain)
				const username = message.userId.split(':')[0].substring(1);
				user = await this.userAdapter.createFederatedUser(
					message.userId,
					username,
					username, // Use username as display name initially
				);
			}

			// 3. Check if user is member of the room
			const isMember = await this.roomAdapter.isUserMemberOfRoom(user._id, room._id);
			if (!isMember) {
				console.warn('[MessageServiceReceiver] User is not member of room:', user._id, room._id);
				return;
			}

			// 4. Create the message
			await this.messageAdapter.createMessage({
				rid: room._id,
				msg: message.content,
				u: {
					_id: user._id,
					username: user.username,
				},
				federation: {
					eventId: message.id,
				},
			});

			console.log('[MessageServiceReceiver] Message created successfully');
		} catch (error) {
			console.error('[MessageServiceReceiver] Failed to process message:', error);
			throw error;
		}
	}

	public async onExternalMessageEdited(messageId: string, newContent: string): Promise<void> {
		console.log('[MessageServiceReceiver] Processing message edit:', messageId);

		try {
			// Find message by external ID
			const message = await this.messageAdapter.getMessageByExternalId(messageId);
			if (!message) {
				console.warn('[MessageServiceReceiver] Message not found:', messageId);
				return;
			}

			// Update the message
			await this.messageAdapter.updateMessage(message._id, newContent);
			console.log('[MessageServiceReceiver] Message updated successfully');
		} catch (error) {
			console.error('[MessageServiceReceiver] Failed to edit message:', error);
			throw error;
		}
	}

	public async onExternalMessageDeleted(messageId: string): Promise<void> {
		console.log('[MessageServiceReceiver] Processing message deletion:', messageId);

		try {
			// Find message by external ID
			const message = await this.messageAdapter.getMessageByExternalId(messageId);
			if (!message) {
				console.warn('[MessageServiceReceiver] Message not found:', messageId);
				return;
			}

			// Delete the message
			await this.messageAdapter.deleteMessage(message._id);
			console.log('[MessageServiceReceiver] Message deleted successfully');
		} catch (error) {
			console.error('[MessageServiceReceiver] Failed to delete message:', error);
			throw error;
		}
	}
}