import Agenda from 'agenda';
import { MongoInternals } from 'meteor/mongo';

function createProcessorId(jobId, appId) {
	return `${ appId }_${ jobId }`;
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

	async registerProcessor(processor, appId) {
		this.orch.debugLog(`The App ${ appId } is registering a new job processor`, processor);
		const processorRealId = createProcessorId(processor.id, appId);
		this.scheduler.define(processorRealId, processor.processor);
	}

	async scheduleOnce(job, appId) {
		this.orch.debugLog(`The App ${ appId } is scheduling an onetime job`, job);
		await this.startAgenda();
		const processorRealId = createProcessorId(job.id, appId);
		await this.scheduler.schedule(job.when, processorRealId, job.data || {});
	}

	async scheduleRecurring(job, appId) {
		this.orch.debugLog(`The App ${ appId } is scheduling a recurring job`, job);
		await this.startAgenda();
		const processorRealId = createProcessorId(job.id, appId);
		await this.scheduler.every(job.cron, processorRealId, job.data || {});
	}

	async cancelJob(jobId, appId) {
		this.orch.debugLog(`The App ${ appId } is canceling a job`, jobId);
		await this.startAgenda();
		const processorRealId = createProcessorId(jobId, appId);
		try {
			await this.scheduler.cancel({ name: processorRealId });
		} catch (e) {
			console.error(e);
		}
	}

	async cancelAllJobs(appId) {
		this.orch.debugLog(`Removing all registered processors of App ${ appId }`);
		await this.startAgenda();
		const matcher = new RegExp(`^${ appId }_`);
		try {
			await this.scheduler.cancel({ name: { $regex: matcher } });
		} catch (e) {
			console.error(e);
		}
	}

	async startAgenda() {
		if (!this.isConnected) {
			await this.scheduler.start();
			this.isConnected = true;
		}
	}
}
