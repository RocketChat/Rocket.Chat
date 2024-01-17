import type { Agenda } from './Agenda';
import { Job } from './Job';
import type { IJob } from './definition/IJob';

export const createJob = (agenda: Agenda, jobData: IJob): Job => {
	return new Job({ agenda, ...jobData });
};
