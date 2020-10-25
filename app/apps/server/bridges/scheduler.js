import Agenda from 'agenda';
import { MongoInternals } from 'meteor/mongo';

function _callProcessor(processor) {
	return (job) => processor(job.attrs.data);
}

export class AppSchedulerBridge {
	constructor(orch) {
		this.orch = orch;
		this.scheduler = new Agenda({
			mongo: MongoInternals.defaultRemoteCollectionDriver().mongo.client.db(),
			collection: 'rocketchat_agenda_jobs',
		});
		this.isConnected = false;
	}

	async registerProcessors(processors = [], appId) {
		this.orch.debugLog(`The App ${ appId } is registering job processors`, processors);
		processors.forEach(({ id, processor }) => this.scheduler.define(id, _callProcessor(processor)));
	}

	async scheduleOnce(job, appId) {
		this.orch.debugLog(`The App ${ appId } is scheduling an onetime job`, job);
		await this.startScheduler();
		await this.scheduler.schedule(job.when, job.id, job.data || {});
	}

	async scheduleRecurring(job, appId) {
		this.orch.debugLog(`The App ${ appId } is scheduling a recurring job`, job);
		await this.startScheduler();
		await this.scheduler.every(job.cron, job.id, job.data || {});
	}

	async cancelJob(jobId, appId) {
		this.orch.debugLog(`The App ${ appId } is canceling a job`, jobId);
		await this.startScheduler();
		try {
			await this.scheduler.cancel({ name: jobId });
		} catch (e) {
			console.error(e);
		}
	}

	async cancelAllJobs(appId) {
		this.orch.debugLog(`Canceling all jobs of App ${ appId }`);
		await this.startScheduler();
		const matcher = new RegExp(`^_${ appId }`);
		try {
			await this.scheduler.cancel({ name: { $regex: matcher } });
		} catch (e) {
			console.error(e);
		}
	}

	async startScheduler() {
		if (!this.isConnected) {
			await this.scheduler.start();
			this.isConnected = true;
		}
	}
}
