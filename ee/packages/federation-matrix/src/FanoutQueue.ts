import { Logger } from '@rocket.chat/logger';

export interface FanoutQueueOptions {
	/** Max number of concurrent tasks (default: 5) */
	concurrency?: number;
	/** Max retry attempts per task (default: 3) */
	maxRetries?: number;
	/** Base delay in ms for exponential backoff (default: 1000) */
	baseDelayMs?: number;
}

interface QueuedTask<T> {
	id: string;
	task: () => Promise<T>;
	retries: number;
	resolve: (value: T) => void;
	reject: (reason: unknown) => void;
}

/**
 * A lightweight in-memory fanout queue with concurrency control and
 * exponential-backoff retry.
 *
 * Usage:
 *   const queue = new FanoutQueue('avatar-updates', { concurrency: 5, maxRetries: 3 });
 *   queue.enqueue('room-!abc', () => federationSDK.updateUserProfile(...));
 *
 * The queue processes up to `concurrency` tasks in parallel.  Failed tasks are
 * re-enqueued with exponential backoff up to `maxRetries` times before the
 * error is logged and the task is dropped.
 */
export class FanoutQueue {
	private readonly queue: QueuedTask<unknown>[] = [];

	private activeCount = 0;

	private readonly concurrency: number;

	private readonly maxRetries: number;

	private readonly baseDelayMs: number;

	private readonly logger: Logger;

	constructor(name: string, options: FanoutQueueOptions = {}) {
		this.concurrency = options.concurrency ?? 5;
		this.maxRetries = options.maxRetries ?? 3;
		this.baseDelayMs = options.baseDelayMs ?? 1000;
		this.logger = new Logger(`FanoutQueue:${name}`);
	}

	/**
	 * Enqueue a task for processing.
	 *
	 * Returns a promise that resolves when the task completes (including any
	 * retries).  Callers that don't need the result can fire-and-forget with
	 * `void queue.enqueue(...)`.
	 */
	enqueue<T>(id: string, task: () => Promise<T>): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.queue.push({
				id,
				task: task as () => Promise<unknown>,
				retries: 0,
				resolve: resolve as (value: unknown) => void,
				reject,
			});
			this.drain();
		});
	}

	private drain(): void {
		while (this.activeCount < this.concurrency && this.queue.length > 0) {
			const item = this.queue.shift();
			if (!item) {
				break;
			}
			this.activeCount++;
			this.process(item);
		}
	}

	private async process(item: QueuedTask<unknown>): Promise<void> {
		try {
			const result = await item.task();
			item.resolve(result);
		} catch (error) {
			if (item.retries < this.maxRetries) {
				const delay = this.baseDelayMs * 2 ** item.retries;
				this.logger.warn({
					msg: `Task "${item.id}" failed (attempt ${item.retries + 1}/${this.maxRetries}), retrying in ${delay}ms`,
					err: error,
				});
				item.retries++;

				setTimeout(() => {
					this.queue.push(item);
					this.drain();
				}, delay);
			} else {
				this.logger.error({
					msg: `Task "${item.id}" exhausted all ${this.maxRetries} retries, dropping`,
					err: error,
				});
				item.reject(error);
			}
		} finally {
			this.activeCount--;
			this.drain();
		}
	}
}
