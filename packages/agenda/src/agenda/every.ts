import createDebugger from 'debug';

import type { Agenda } from '.';
import type { Job } from '../job';
import type { JobOptions } from '../job/repeat-every';

const debug = createDebugger('agenda:every');

/**
 * Creates a scheduled job with given interval and name/names of the job to run
 * @name Agenda#every
 * @function
 * @param interval - run every X interval
 * @param names - String or strings of jobs to schedule
 * @param data - data to run for job
 * @param options - options to run job for
 * @returns Job/s created. Resolves when schedule fails or passes
 */
export const every = async function (
	this: Agenda,
	interval: string,
	names: string | string[],
	data?: unknown,
	options?: JobOptions,
): Promise<any> {
	/**
	 * Internal method to setup job that gets run every interval
	 * @param interval run every X interval
	 * @param name String job to schedule
	 * @param [data] data to run for job
	 * @param [options] options to run job for
	 * @returns instance of job
	 */
	const createJob = async (interval: string, name: string, data?: unknown, options?: JobOptions): Promise<Job> => {
		const job = this.create(name, data);

		job.attrs.type = 'single';
		job.repeatEvery(interval, options);
		return job.save();
	};

	/**
	 * Internal helper method that uses createJob to create jobs for an array of names
	 * @param interval run every X interval
	 * @param names Strings of jobs to schedule
	 * @param [data] data to run for job
	 * @param [options] options to run job for
	 * @return array of jobs created
	 */
	const createJobs = async (interval: string, names: string[], data?: unknown, options?: JobOptions): Promise<Job[] | undefined> => {
		try {
			const jobs: Array<Promise<Job>> = [];
			names.map((name) => jobs.push(createJob(interval, name, data, options)));

			debug('every() -> all jobs created successfully');

			return Promise.all(jobs);
		} catch (error) {
			// @TODO: catch - ignore :O
			debug('every() -> error creating one or more of the jobs', error);
		}
	};

	if (typeof names === 'string') {
		debug('Agenda.every(%s, %O, %O)', interval, names, options);
		const jobs = await createJob(interval, names, data, options);

		return jobs;
	}

	if (Array.isArray(names)) {
		debug('Agenda.every(%s, %s, %O)', interval, names, options);
		const jobs = await createJobs(interval, names, data, options);

		return jobs;
	}
};
