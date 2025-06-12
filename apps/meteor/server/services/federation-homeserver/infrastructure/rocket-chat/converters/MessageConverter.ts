import type { IMessage, IUser } from '@rocket.chat/core-typings';
import type { FederatedHomeserverMessage } from '../../../domain/FederatedHomeserverMessage';

export class MessageConverter {
	constructor(private homeserverDomain: string) {}

	// Convert Rocket.Chat message to Homeserver message format
	public toHomeserverMessage(
		message: IMessage, 
		room: { _id: string; federation?: { externalId?: string } },
		sender: { _id: string; username?: string },
		externalMessageId?: string,
	): FederatedHomeserverMessage {
		const federatedMessage: FederatedHomeserverMessage = {
			externalId: externalMessageId || this.generateExternalMessageId(message),
			roomExternalId: room.federation?.externalId || `!${room._id}:${this.homeserverDomain}`,
			senderExternalId: this.generateExternalUserId(sender),
			content: {
				body: message.msg,
				msgtype: this.getMessageType(message),
				format: message.md ? 'org.matrix.custom.html' : undefined,
				formatted_body: message.md ? message.msg : undefined,
			},
			timestamp: message.ts || new Date(),
			editedAt: message.editedAt,
		};

		// Handle file uploads
		if (message.file) {
			federatedMessage.content.msgtype = this.getFileMessageType(message.file._id);
			federatedMessage.content.url = message.file.url;
			federatedMessage.content.info = {
				size: message.file.size,
				mimetype: message.file.type,
			};
		}

		return federatedMessage;
	}

	// Convert Homeserver message event to Rocket.Chat message data
	public toRocketChatMessageData(
		event: any,
		internalRoomId: string,
		internalUserId: string,
	): Partial<IMessage> {
		const messageData: Partial<IMessage> = {
			rid: internalRoomId,
			msg: event.content?.body || '',
			u: {
				_id: internalUserId,
				username: this.extractUsername(event.sender),
			},
			ts: new Date(event.origin_server_ts || Date.now()),
			_updatedAt: new Date(),
			federation: {
				type: 'homeserver',
				eventId: event.event_id,
				originalEventId: event.event_id,
			},
		};

		// Handle edits
		if (event.content?.['m.relates_to']?.rel_type === 'm.replace') {
			messageData.editedAt = new Date();
			messageData.editedBy = {
				_id: internalUserId,
				username: this.extractUsername(event.sender),
			};
		}

		// Handle file messages
		if (event.content?.msgtype && ['m.image', 'm.file', 'm.audio', 'm.video'].includes(event.content.msgtype)) {
			// File handling would be implemented here
			messageData.msg = event.content.body || 'File attachment';
		}

		return messageData;
	}

	// Generate external message ID
	public generateExternalMessageId(message: IMessage): string {
		return `$${message._id}:${this.homeserverDomain}`;
	}

	// Generate external user ID
	private generateExternalUserId(user: { _id: string; username?: string }): string {
		const username = user.username || user._id;
		return `@${username}:${this.homeserverDomain}`;
	}

	// Extract username from external user ID
	private extractUsername(externalUserId: string): string {
		// Remove @ prefix and domain suffix
		const match = externalUserId.match(/^@(.+):.+$/);
		return match ? match[1] : externalUserId;
	}

	// Determine message type
	private getMessageType(message: IMessage): string {
		if (message.file) {
			return this.getFileMessageType(message.file.type);
		}
		return 'm.text';
	}

	// Determine file message type
	private getFileMessageType(mimeType?: string): string {
		if (!mimeType) return 'm.file';
		
		if (mimeType.startsWith('image/')) return 'm.image';
		if (mimeType.startsWith('audio/')) return 'm.audio';
		if (mimeType.startsWith('video/')) return 'm.video';
		
		return 'm.file';
	}

	// Convert message deletion event
	public toHomeserverRedaction(
		message: IMessage,
		reason?: string,
	): any {
		return {
			type: 'm.room.redaction',
			redacts: message.federation?.eventId || this.generateExternalMessageId(message),
			content: {
				reason: reason || 'Message deleted',
			},
		};
	}

	// Check if this is a system message that should not be federated
	public isSystemMessage(message: IMessage): boolean {
		return !!message.t; // All messages with a type are system messages
	}
}