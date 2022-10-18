import type { Job } from '.';

/**
 * Updates "lockedAt" time so the job does not get picked up again
 * @name Job#touch
 * @function
 */
export const touch = async function (this: Job): Promise<Job> {
	this.attrs.lockedAt = new Date();
	return this.save();
};
