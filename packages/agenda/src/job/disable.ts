import type { Job } from '.';

/**
 * Prevents the job type from running
 * @name Job#disable
 * @function
 */
export const disable = function (this: Job): Job {
	this.attrs.disabled = true;
	return this;
};
