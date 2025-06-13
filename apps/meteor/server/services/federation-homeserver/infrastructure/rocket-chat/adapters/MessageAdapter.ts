import type { IMessage } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
// @ts-ignore - TypeScript issue with internal import
import { getConnection } from '@rocket.chat/models/dist/lib/BaseRaw';
import { HomeserverFederationMapping } from './HomeserverFederationMapping';
import type { IHomeserverMessageAdapter } from '../../../application/message/receiver/MessageServiceReceiver';

export class MessageAdapter implements IHomeserverMessageAdapter {
	constructor(private homeserverDomain: string) {}
	
	// Get database connection
	private async getDb() {
		return getConnection().db;
	}

	// Create a message in Rocket.Chat
	async createMessage(message: {
		rid: string;
		msg: string;
		u: { _id: string; username: string };
		federation?: { eventId: string };
	}): Promise<string> {
		const messageId = Random.id();
		
		const newMessage: IMessage = {
			_id: messageId,
			rid: message.rid,
			msg: message.msg,
			ts: new Date(),
			u: {
				_id: message.u._id,
				username: message.u.username,
			},
			_updatedAt: new Date(),
			// Store federation metadata if provided
			...(message.federation && { 
				federation: {
					...message.federation,
					type: 'homeserver',
				}
			}),
			federated: !!message.federation,
		};

		await Messages.insertOne(newMessage);
		
		// Store external ID mapping if provided
		if (message.federation?.eventId) {
			const db = await this.getDb();
			await HomeserverFederationMapping.createOrUpdate({
				type: 'message',
				internalId: messageId,
				externalId: message.federation.eventId,
				homeserverDomain: this.extractDomain(message.federation.eventId),
			}, db);
		}
		
		// TODO: Trigger notifications and other post-message actions
		
		return messageId;
	}

	// Update a message
	async updateMessage(messageId: string, newContent: string): Promise<void> {
		await Messages.updateOne(
			{ _id: messageId },
			{
				$set: {
					msg: newContent,
					editedAt: new Date(),
					editedBy: {
						_id: 'homeserver-bridge',
						username: 'homeserver-bridge',
					},
					_updatedAt: new Date(),
				},
			},
		);
	}

	// Delete a message
	async deleteMessage(messageId: string): Promise<void> {
		// In Rocket.Chat, we typically don't hard delete messages
		// Instead, we mark them as deleted
		await Messages.updateOne(
			{ _id: messageId },
			{
				$set: {
					_hidden: true,
					_updatedAt: new Date(),
				},
			},
		);
	}

	// Get message by external ID
	async getMessageByExternalId(externalId: string): Promise<{ _id: string } | null> {
		// First try to find by federation metadata
		const message = await Messages.findOne({ 'federation.eventId': externalId });
		if (message) {
			return { _id: message._id };
		}

		// Fallback to mapping collection
		const db = await this.getDb();
		const mapping = await HomeserverFederationMapping.findByExternalId('message', externalId, db);
		
		if (!mapping) {
			return null;
		}

		const mappedMessage = await Messages.findOneById(mapping.internalId);
		return mappedMessage ? { _id: mappedMessage._id } : null;
	}

	// Get external message ID from internal ID
	async getExternalMessageId(internalMessageId: string): Promise<string | null> {
		// First try to get from message metadata
		const message = await Messages.findOneById(internalMessageId);
		if (message?.federation?.eventId) {
			return message.federation.eventId;
		}

		// Fallback to mapping collection
		const db = await this.getDb();
		const mapping = await HomeserverFederationMapping.findByInternalId('message', internalMessageId, db);
		return mapping?.externalId || null;
	}

	// Get or create external message ID
	async getOrCreateExternalMessageId(message: IMessage): Promise<string> {
		// First check if mapping exists
		const existingExternalId = await this.getExternalMessageId(message._id);
		if (existingExternalId) {
			return existingExternalId;
		}

		// Create new external ID
		const externalMessageId = `$${message._id}:${this.homeserverDomain}`;

		// Store the mapping
		await this.storeExternalMessageId(message._id, externalMessageId);
		
		return externalMessageId;
	}

	// Store external message ID mapping
	async storeExternalMessageId(internalMessageId: string, externalMessageId: string): Promise<void> {
		// Update message with federation metadata
		await Messages.updateOne(
			{ _id: internalMessageId },
			{
				$set: {
					federated: true,
					federation: {
						type: 'homeserver',
						eventId: externalMessageId,
						originalEventId: externalMessageId,
					},
				},
			},
		);

		// Also store in mapping collection
		const db = await this.getDb();
		await HomeserverFederationMapping.createOrUpdate({
			type: 'message',
			internalId: internalMessageId,
			externalId: externalMessageId,
			homeserverDomain: this.extractDomain(externalMessageId),
		}, db);
	}

	// Check if message is from homeserver federation
	async isHomeserverMessage(messageId: string): Promise<boolean> {
		const message = await Messages.findOneById(messageId);
		return message?.federated === true && message?.federation?.type === 'homeserver';
	}

	// Extract domain from external ID
	private extractDomain(externalId: string): string {
		const colonIndex = externalId.indexOf(':');
		if (colonIndex === -1) {
			return this.homeserverDomain;
		}
		return externalId.substring(colonIndex + 1);
	}
}