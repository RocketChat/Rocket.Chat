import type { HomeserverEvent, HomeserverMessage } from '@rocket.chat/core-services';
import { BaseEventHandler } from './BaseEventHandler';

export interface IMessageServiceReceiver {
	onExternalMessageReceived(message: HomeserverMessage): Promise<void>;
	onExternalMessageEdited(messageId: string, newContent: string): Promise<void>;
	onExternalMessageDeleted(messageId: string): Promise<void>;
}

export class MessageHandler extends BaseEventHandler {
	constructor(
		private messageReceiver: IMessageServiceReceiver,
	) {
		super('HomeserverMessageHandler');
	}

	public canHandle(event: HomeserverEvent): boolean {
		return event.type === 'message.new' || 
			   event.type === 'message.edit' || 
			   event.type === 'message.delete';
	}

	public async handle(event: HomeserverEvent): Promise<void> {
		this.debug('Handling message event:', event.type, event.id);

		try {
			switch (event.type) {
				case 'message.new':
					await this.handleNewMessage(event);
					break;
				case 'message.edit':
					await this.handleEditMessage(event);
					break;
				case 'message.delete':
					await this.handleDeleteMessage(event);
					break;
				default:
					this.error('Unknown message event type:', event.type);
			}
		} catch (error) {
			this.error(`Failed to handle message event ${event.type}:`, error);
			throw error;
		}
	}

	private async handleNewMessage(event: HomeserverEvent): Promise<void> {
		const message = event.data as HomeserverMessage;
		
		if (!message) {
			throw new Error('Invalid message data in event');
		}

		this.log('Processing new message from homeserver:', message.id);
		await this.messageReceiver.onExternalMessageReceived(message);
	}

	private async handleEditMessage(event: HomeserverEvent): Promise<void> {
		const { messageId, newContent } = event.data as { messageId: string; newContent: string };
		
		if (!messageId || !newContent) {
			throw new Error('Invalid edit message data in event');
		}

		this.log('Processing message edit from homeserver:', messageId);
		await this.messageReceiver.onExternalMessageEdited(messageId, newContent);
	}

	private async handleDeleteMessage(event: HomeserverEvent): Promise<void> {
		const { messageId } = event.data as { messageId: string };
		
		if (!messageId) {
			throw new Error('Invalid delete message data in event');
		}

		this.log('Processing message deletion from homeserver:', messageId);
		await this.messageReceiver.onExternalMessageDeleted(messageId);
	}
}