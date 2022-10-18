import type { Job } from '.';
import { parsePriority } from '../utils';

/**
 * Sets priority of the job
 * @param priority priority of when job should be queued
 */
export const priority = function (this: Job, priority: string): Job {
	this.attrs.priority = parsePriority(priority);
	return this;
};
