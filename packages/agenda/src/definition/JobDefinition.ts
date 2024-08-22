import type { Job } from '../Job';

export type JobOptions = {
	concurrency: number;
	lockLimit: number;
	priority: number;
	lockLifetime: number;
};

export type JobDefinition = JobOptions & {
	fn: (job: Job, jobCallback?: (err?: Error) => Promise<void>) => Promise<void> | void;
	running: number;
	locked: number;
};
