import type { Job, JobAttributes } from '.';

/**
 * Given a job, turn it into an object we can store in Mongo
 * @name Job#toJSON
 * @function
 * @returns json object from Job
 */
export const toJson = function (this: Job): Partial<JobAttributes> {
	const attrs = this.attrs || {};
	const result = {};

	for (const prop in attrs) {
		if ({}.hasOwnProperty.call(attrs, prop)) {
			// @ts-expect-error index signature missing
			result[prop] = attrs[prop];
		}
	}

	const dates = ['lastRunAt', 'lastFinishedAt', 'nextRunAt', 'failedAt', 'lockedAt'];
	dates.forEach((d) => {
		// @ts-expect-error index signature missing
		if (result[d]) {
			// @ts-expect-error index signature missing
			result[d] = new Date(result[d]);
		}
	});

	return result;
};
