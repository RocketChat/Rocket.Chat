import createDebugger from 'debug';

import type { Agenda } from '.';
import type { Job } from '../job';

const debug = createDebugger('agenda:now');

/**
 * Create a job for this exact moment
 * @name Agenda#now
 * @function
 * @param name name of job to schedule
 * @param data data to pass to job
 */
export const now = async function (this: Agenda, name: string, data: any): Promise<Job> {
	debug('Agenda.now(%s, [Object])', name);
	try {
		const job = this.create(name, data);

		job.schedule(new Date());
		await job.save();

		return job;
	} catch (error) {
		debug('error trying to create a job for this exact moment');
		throw error;
	}
};
