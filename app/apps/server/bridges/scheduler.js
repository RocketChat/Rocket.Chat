import Agenda from 'agenda';

export class AppSchedulerBridge {
	constructor(orch) {
		this.orch = orch;
		this.scheduler = new Agenda();
	}

	async registerProcessor(processor, appId) {
		this.orch.debugLog(`The App ${ appId } is registering a new job processor`, processor);
		this.scheduler.define(processor.id, processor.processor);
	}

	async scheduleOnce(job, appId) {
		this.orch.debugLog(`The App ${ appId } is scheduling an onetime job`, job);
		await this.scheduler.schedule(job.when, job.id, job.data || {});
	}

	async scheduleRecurring(job, appId) {
		this.orch.debugLog(`The App ${ appId } is scheduling a recurring job`, job);
		await this.scheduler.every(job.cron, job.id, job.data || {});
	}
}
