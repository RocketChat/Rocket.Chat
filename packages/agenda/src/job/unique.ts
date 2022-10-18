import type { Job } from '.';

/**
 * Data to ensure is unique for job to be created
 * @name Job#unique
 * @function
 * @param unique mongo data query for unique
 * @param options unique options
 */
export const unique = function (this: Job, unique: any, options?: { insertOnly: boolean }): Job {
	this.attrs.unique = unique;
	this.attrs.uniqueOpts = options;
	return this;
};
