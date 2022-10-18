import type { Job } from '.';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface JobOptions {
	timezone?: string;
	startDate?: Date | number;
	endDate?: Date | number;
	skipDays?: string;
	skipImmediate?: boolean;
}

/**
 * Sets a job to repeat every X amount of time
 * @name Job#repeatEvery
 * @function
 * @param interval repeat every X
 * @param options options to use for job
 */
export const repeatEvery = function (this: Job, interval: string, options: JobOptions = {}): Job {
	this.attrs.repeatInterval = interval;
	this.attrs.repeatTimezone = options.timezone ? options.timezone : null;
	// Following options are added to handle start day
	// and cases like run job every x days (skip some days)
	this.attrs.startDate = options.startDate ?? null;
	this.attrs.endDate = options.endDate ?? null;
	this.attrs.skipDays = options.skipDays ?? null;
	if (options.skipImmediate) {
		// Set the lastRunAt time to the nextRunAt so that the new nextRunAt will be computed in reference to the current value.
		this.attrs.lastRunAt = this.attrs.nextRunAt || new Date();
		this.computeNextRunAt();
		this.attrs.lastRunAt = undefined;
	} else {
		this.computeNextRunAt();
	}

	return this;
};
