import type { Job } from './Job';
import type { JobDefinition } from './definition/JobDefinition';

export class JobProcessingQueue {
	private _queue: Job[] = [];

	get length(): number {
		return this._queue.length;
	}

	/**
	 * Pops and returns last queue element (next job to be processed) without checking concurrency.
	 * @returns {Job} Next Job to be processed
	 */
	pop(): Job | undefined {
		return this._queue.pop();
	}

	/**
	 * Inserts job in first queue position
	 */
	push(job: Job): void {
		this._queue.push(job);
	}

	/**
	 * Inserts job in queue where it will be order from left to right in decreasing
	 * order of nextRunAt and priority (in case of same nextRunAt), if all values
	 * are even the first jobs to be introduced will have priority
	 */
	insert(job: Job): void {
		const matchIndex = this._queue.findIndex((element) => {
			if (!element.attrs.nextRunAt || !job.attrs.nextRunAt) {
				return element.attrs.nextRunAt === job.attrs.nextRunAt;
			}

			if (element.attrs.nextRunAt.getTime() <= job.attrs.nextRunAt.getTime()) {
				if (element.attrs.nextRunAt.getTime() === job.attrs.nextRunAt.getTime()) {
					if ((element.attrs.priority || 0) >= (job.attrs.priority || 0)) {
						return true;
					}
				} else {
					return true;
				}
			}

			return false;
		});

		if (matchIndex === -1) {
			this._queue.push(job);
		} else {
			this._queue.splice(matchIndex, 0, job);
		}
	}

	/**
	 * Returns (does not pop, element remains in queue) first element (always from the right)
	 * that can be processed (not blocked by concurrency execution)
	 */
	returnNextConcurrencyFreeJob(agendaDefinitions: Record<string, JobDefinition>): Job {
		let next;
		for (next = this._queue.length - 1; next > 0; next -= 1) {
			const def = agendaDefinitions[this._queue[next].attrs.name];
			if (def.concurrency > def.running) {
				break;
			}
		}

		return this._queue[next];
	}
}
