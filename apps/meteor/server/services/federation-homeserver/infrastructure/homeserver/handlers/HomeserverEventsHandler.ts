import type { HomeserverEvent } from '@rocket.chat/core-services';
import { BaseEventHandler } from './BaseEventHandler';
import { MessageHandler } from './MessageHandler';
import { RoomHandler } from './RoomHandler';
import { UserHandler } from './UserHandler';

export class HomeserverEventsHandler {
	private handlers: BaseEventHandler[] = [];
	private eventQueue: HomeserverEvent[] = [];
	private processing = false;

	constructor(
		messageHandler: MessageHandler,
		roomHandler: RoomHandler,
		userHandler: UserHandler,
	) {
		this.handlers = [messageHandler, roomHandler, userHandler];
	}

	public async handleEvent(event: HomeserverEvent): Promise<void> {
		// Add event to queue
		this.eventQueue.push(event);
		
		// Process queue if not already processing
		if (!this.processing) {
			await this.processQueue();
		}
	}

	private async processQueue(): Promise<void> {
		this.processing = true;

		while (this.eventQueue.length > 0) {
			const event = this.eventQueue.shift();
			if (!event) continue;

			try {
				await this.processEvent(event);
			} catch (error) {
				console.error('[HomeserverEventsHandler] Failed to process event:', event.type, error);
				// Continue processing other events even if one fails
			}
		}

		this.processing = false;
	}

	private async processEvent(event: HomeserverEvent): Promise<void> {
		console.log('[HomeserverEventsHandler] Processing event:', event.type, event.id);

		// Find handler for this event
		const handler = this.handlers.find(h => h.canHandle(event));
		
		if (!handler) {
			console.warn('[HomeserverEventsHandler] No handler found for event type:', event.type);
			return;
		}

		// Handle the event
		await handler.handle(event);
	}

	public stop(): void {
		// Clear the queue
		this.eventQueue = [];
		this.processing = false;
	}
}