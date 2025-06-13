import type { IMessage } from '@rocket.chat/core-typings';
import type { HomeserverMessage } from '@rocket.chat/core-services';
import { FederatedHomeserverMessage } from '../../../domain/FederatedHomeserverMessage';

export class MessageConverter {
	constructor(private homeserverDomain: string) {}

	/**
	 * Convert Rocket.Chat message to Homeserver message format
	 */
	public toHomeserverMessage(
		message: IMessage,
		externalRoomId: string,
		externalUserId: string,
	): HomeserverMessage {
		return {
			id: this.toExternalMessageId(message),
			roomId: externalRoomId,
			userId: externalUserId,
			content: message.msg,
			timestamp: message.ts ? new Date(message.ts).getTime() : Date.now(),
			edited: !!message.editedAt,
		};
	}

	/**
	 * Convert Homeserver message to Rocket.Chat message format
	 */
	public toRocketChatMessage(
		homeserverMessage: HomeserverMessage,
		internalRoomId: string,
		user: { _id: string; username: string },
	): Partial<IMessage> {
		return {
			rid: internalRoomId,
			msg: homeserverMessage.content,
			u: user,
			ts: new Date(homeserverMessage.timestamp),
			_updatedAt: new Date(homeserverMessage.timestamp),
			// Store federation metadata
			federation: {
				eventId: homeserverMessage.id,
			},
		};
	}

	/**
	 * Generate external message ID from internal message
	 */
	public toExternalMessageId(message: IMessage): string {
		// Use existing external ID if available
		if (message.federation?.eventId) {
			return message.federation.eventId;
		}
		
		// Generate new external ID
		const messageId = message._id.replace(/[^a-zA-Z0-9]/g, '');
		return `$${messageId}:${this.homeserverDomain}`;
	}

	/**
	 * Extract message ID from external message ID
	 * Format: $messageid:domain
	 */
	public extractMessageIdFromExternalId(externalId: string): string {
		if (!externalId.startsWith('$')) {
			throw new Error(`Invalid external message ID format: ${externalId}`);
		}
		
		const colonIndex = externalId.indexOf(':');
		if (colonIndex === -1) {
			throw new Error(`Invalid external message ID format: ${externalId}`);
		}
		
		return externalId.substring(1, colonIndex);
	}

	/**
	 * Extract domain from external message ID
	 */
	public extractDomainFromExternalId(externalId: string): string {
		const colonIndex = externalId.indexOf(':');
		if (colonIndex === -1) {
			throw new Error(`Invalid external message ID format: ${externalId}`);
		}
		
		return externalId.substring(colonIndex + 1);
	}

	/**
	 * Check if message is from local homeserver
	 */
	public isLocalMessage(externalId: string): boolean {
		try {
			const domain = this.extractDomainFromExternalId(externalId);
			return domain === this.homeserverDomain || domain === 'local';
		} catch {
			return false;
		}
	}

	/**
	 * Create federated message domain object
	 */
	public toFederatedMessage(
		internalId: string,
		externalId: string,
		homeserverMessage: HomeserverMessage,
		internalRoomId: string,
		internalUserId: string,
	): FederatedHomeserverMessage {
		return new FederatedHomeserverMessage(
			internalId,
			externalId,
			internalRoomId,
			internalUserId,
			homeserverMessage.content,
			new Date(homeserverMessage.timestamp),
			homeserverMessage.edited || false,
			this.extractDomainFromExternalId(externalId),
		);
	}

	/**
	 * Convert message edit to homeserver format
	 */
	public toHomeserverMessageEdit(
		originalExternalId: string,
		newContent: string,
		editTimestamp: Date = new Date(),
	): { messageId: string; content: string; editedAt: number } {
		return {
			messageId: originalExternalId,
			content: newContent,
			editedAt: editTimestamp.getTime(),
		};
	}

	/**
	 * Convert message reaction to homeserver format
	 */
	public toHomeserverReaction(
		messageExternalId: string,
		reaction: string,
		userExternalId: string,
	): { messageId: string; reaction: string; userId: string } {
		return {
			messageId: messageExternalId,
			reaction,
			userId: userExternalId,
		};
	}

	/**
	 * Handle special message types (like file uploads)
	 */
	public isFileMessage(message: IMessage): boolean {
		return !!(message.file || message.attachments?.length);
	}

	/**
	 * Extract file information from message
	 */
	public extractFileInfo(message: IMessage): { name: string; type: string; size: number } | null {
		if (message.file) {
			return {
				name: message.file.name || 'file',
				type: message.file.type || 'application/octet-stream',
				size: message.file.size || 0,
			};
		}
		
		if (message.attachments?.[0]) {
			const attachment = message.attachments[0];
			return {
				name: attachment.title || 'file',
				type: attachment.type || 'application/octet-stream',
				size: attachment.size || 0,
			};
		}
		
		return null;
	}
}