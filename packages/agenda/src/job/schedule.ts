// @ts-expect-error
import date from 'date.js';

import type { Job } from '.';

/**
 * Schedules a job to run at specified time
 * @name Job#schedule
 * @function
 * @param time schedule a job to run "then"
 */
export const schedule = function (this: Job, time: string | Date): Job {
	const d = new Date(time);
	this.attrs.nextRunAt = Number.isNaN(d.getTime()) ? date(time) : d;
	return this;
};
