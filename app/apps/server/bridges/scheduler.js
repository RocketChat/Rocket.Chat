import Agenda from 'agenda';

export class AppSchedulerBridge {
	constructor(orch) {
		this.orch = orch;
	}

	async define(info) {
		this.orch.debugLog(`The App ${ info.appId } is defining a new schedulable job`, info);

		if (info.job.processor) {
			Agenda.define(info.job.name, info.job.processor);
		} else {
			Agenda.define(info.job.name, async () => {
				console.log(`this is the new job ${ info.job.name }`);
			});
		}
	}

	async schedule(info) {
		this.orch.debugLog(`The App ${ info.appId } is scheduling a new job`, info);
		await Agenda.every(info.job.schedule, info.job.name, info.job.data || {});
	}
}
