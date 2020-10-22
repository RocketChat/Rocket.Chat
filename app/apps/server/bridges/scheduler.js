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

	async scheduleOnce(info) {
		this.orch.debugLog(`The App ${ info.appId } is scheduling an onetime job`, info);
		await this.scheduler.schedule(info.job.when, info.job.id, info.job.data || {});
	}

	async scheduleRecurring(info) {
		this.orch.debugLog(`The App ${ info.appId } is scheduling a recurring job`, info);
		await this.scheduler.every(info.job.cron, info.job.id, info.job.data || {});
	}
}
