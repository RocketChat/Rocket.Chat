import createDebugger from 'debug';

import type { Agenda } from '.';
import type { Job } from '../job';

const debug = createDebugger('agenda:schedule');

/**
 * Schedule a job or jobs at a specific time
 * @name Agenda#schedule
 * @function
 * @param when when the job gets run
 * @param names array of job names to run
 * @param data data to send to job
 * @returns job or jobs created
 */
export function schedule(this: Agenda, when: string | Date, names: string, data: any): Promise<Job>;
export function schedule(this: Agenda, when: string | Date, names: string[], data: any): Promise<Job[]>;
export function schedule(this: Agenda, when: string | Date, names: string | string[], data: any): Promise<Job | Job[]> {
	/**
	 * Internal method that creates a job with given date
	 * @param when when the job gets run
	 * @param name of job to run
	 * @param data data to send to job
	 * @returns instance of new job
	 */
	const createJob = async (when: string | Date, name: string, data: any): Promise<Job> => {
		const job = this.create(name, data);

		await job.schedule(when).save();

		return job;
	};

	/**
	 * Internal helper method that calls createJob on a names array
	 * @param when when the job gets run
	 * @param names names of jobs to run
	 * @param data data to send to job
	 * @returns jobs that were created
	 */
	const createJobs = async (when: string | Date, names: string[], data: any): Promise<Job[]> => {
		try {
			const createJobList: Array<Promise<Job>> = [];
			names.map((name) => createJobList.push(createJob(when, name, data)));
			debug('Agenda.schedule()::createJobs() -> all jobs created successfully');
			return Promise.all(createJobList);
		} catch (error) {
			debug('Agenda.schedule()::createJobs() -> error creating one or more of the jobs');
			throw error;
		}
	};

	if (typeof names === 'string') {
		debug('Agenda.schedule(%s, %O, [%O], cb)', when, names);
		return createJob(when, names, data);
	}

	if (Array.isArray(names)) {
		debug('Agenda.schedule(%s, %O, [%O])', when, names);
		return createJobs(when, names, data);
	}

	throw new TypeError('Name must be string or array of strings');
}
