import 'reflect-metadata';
import { injectable } from 'tsyringe';
import type { EventBase } from '../models/event.model';

export interface StagingAreaEventType {
	eventId: string;
	roomId: string;
	origin: string;
	event: EventBase;
	metadata?: Record<string, unknown>;
}

type QueueHandler = (item: StagingAreaEventType) => Promise<void>;

@injectable()
export class StagingAreaQueue {
	private queue: StagingAreaEventType[] = [];
	private handlers: QueueHandler[] = [];
	private processing = false;

	enqueue(item: StagingAreaEventType): void {
		this.queue.push(item);
		this.processQueue();
	}

	dequeue(): StagingAreaEventType | undefined {
		return this.queue.shift();
	}

	registerHandler(handler: QueueHandler): void {
		this.handlers.push(handler);
	}

	private async processQueue(): Promise<void> {
		if (this.processing || this.queue.length === 0) {
			return;
		}

		this.processing = true;

		try {
			while (this.queue.length > 0) {
				const item = this.queue.shift();
				if (!item) continue;

				for (const handler of this.handlers) {
					await handler(item);
				}
			}
		} finally {
			this.processing = false;
		}
	}
}
