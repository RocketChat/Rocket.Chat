import type { Job } from '.';

/**
 * Remove the job from MongoDB
 * @name Job#remove
 * @function
 */
export const remove = async function (this: Job): Promise<number | undefined> {
	return this.agenda.cancel({ _id: this.attrs._id });
};
