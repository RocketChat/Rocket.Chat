import type { Agenda } from './Agenda.js';
import { Job } from './Job.js';
import type { IJob } from './definition/IJob.js';

export const createJob = (agenda: Agenda, jobData: IJob): Job => {
	return new Job({ agenda, ...jobData });
};
