import type { Job } from '.';

/**
 * Allows job type to run
 * @name Job#enable
 * @function
 */
export const enable = function (this: Job): Job {
	this.attrs.disabled = false;
	return this;
};
