import logger from '../utils/logger';

export type QueueHandler<T> = (item: T) => Promise<void> | void;

export abstract class BaseQueue<T> {
	protected queue: T[] = [];
	protected processing = false;
	protected handler?: QueueHandler<T>;

	registerHandler(handler: QueueHandler<T>) {
		this.handler = handler;
		this.processQueue();
	}

	enqueue(item: T) {
		this.queue.push(item);
		this.processQueue();
	}

	protected async processQueue() {
		if (this.processing || !this.handler) {
			return;
		}

		this.processing = true;
		while (this.queue.length > 0) {
			const item = this.queue.shift();
			try {
				if (!item) {
					continue;
				}

				await this.handler(item);
			} catch (err) {
				logger.error(`${this.constructor.name}: Error processing item`, err);
			}
		}
		this.processing = false;
	}
}
