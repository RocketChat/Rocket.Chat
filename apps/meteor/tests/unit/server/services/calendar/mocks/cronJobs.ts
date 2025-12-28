import type { AgendaCronJobs } from '@rocket.chat/cron';

// #TODO: Move this to a package and write unit tests there ensuring that the behavior of the mock and the real class match 1:1
export class MockedCronJobs {
	public jobNames = new Set<string>();

	private _started = false;

	public get started(): boolean {
		return this._started;
	}

	start: AgendaCronJobs['start'] = async () => {
		this._started = true;
	};

	add: AgendaCronJobs['add'] = async (name) => {
		this.jobNames.add(name);
	};

	addAtTimestamp: AgendaCronJobs['addAtTimestamp'] = async (name) => {
		this.jobNames.add(name);
	};

	remove: AgendaCronJobs['remove'] = async (name) => {
		this.jobNames.delete(name);
	};

	has: AgendaCronJobs['has'] = async (jobName) => {
		return this.jobNames.has(jobName);
	};
}
