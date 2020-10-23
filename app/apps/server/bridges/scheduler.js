import Agenda from 'agenda';

function createProcessorId(jobId, appId) {
	return `${ jobId }_${ appId }`;
}

export class AppSchedulerBridge {
	constructor(orch) {
		this.orch = orch;
		this.scheduler = new Agenda();
	}

	async registerProcessor(processor, appId) {
		this.orch.debugLog(`The App ${ appId } is registering a new job processor`, processor);
		const processorRealId = createProcessorId(processor.id, appId);
		this.scheduler.define(processorRealId, processor.processor);
	}

	async scheduleOnce(job, appId) {
		this.orch.debugLog(`The App ${ appId } is scheduling an onetime job`, job);
		const processorRealId = createProcessorId(job.id, appId);
		await this.scheduler.schedule(job.when, processorRealId, job.data || {});
	}

	async scheduleRecurring(job, appId) {
		this.orch.debugLog(`The App ${ appId } is scheduling a recurring job`, job);
		const processorRealId = createProcessorId(job.id, appId);
		await this.scheduler.every(job.cron, processorRealId, job.data || {});
	}
}
