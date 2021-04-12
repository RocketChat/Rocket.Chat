import Agenda from 'agenda';
import { MongoInternals } from 'meteor/mongo';
import { StartupType } from '@rocket.chat/apps-engine/definition/scheduler';

function _callProcessor(processor) {
	return (job) => processor(job?.attrs?.data || {});
}

export class AppSchedulerBridge {
	constructor(orch) {
		this.orch = orch;
		this.scheduler = new Agenda({
			mongo: MongoInternals.defaultRemoteCollectionDriver().mongo.client.db(),
			db: { collection: 'rocketchat_apps_scheduler' },
			// this ensures the same job doesn't get executed multiple times in a cluster
			defaultConcurrency: 1,
		});
		this.isConnected = false;
	}

	async registerProcessors(processors = [], appId) {
		const runAfterRegister = [];
		this.orch.debugLog(`The App ${ appId } is registering job processors`, processors);
		processors.forEach(({ id, processor, startupSetting }) => {
			this.scheduler.define(id, _callProcessor(processor));

			if (startupSetting) {
				switch (startupSetting.type) {
					case StartupType.ONETIME:
						runAfterRegister.push(this.scheduleOnceAfterRegister({ id, when: startupSetting.when, data: startupSetting.data }, appId));
						break;
					case StartupType.RECURRING:
						runAfterRegister.push(this.scheduleRecurring({ id, interval: startupSetting.interval, data: startupSetting.data }, appId));
						break;
					default:
						break;
				}
			}
		});

		if (runAfterRegister.length) {
			await Promise.all(runAfterRegister);
		}
	}

	async scheduleOnce(job, appId) {
		this.orch.debugLog(`The App ${ appId } is scheduling an onetime job`, job);
		await this.startScheduler();
		await this.scheduler.schedule(job.when, job.id, job.data || {});
	}

	async scheduleOnceAfterRegister(job, appId) {
		const scheduledJobs = await this.scheduler.jobs({ name: job.id, type: 'normal' });
		if (!scheduledJobs.length) {
			await this.scheduleOnce(job, appId);
		}
	}

	async scheduleRecurring(job, appId) {
		this.orch.debugLog(`The App ${ appId } is scheduling a recurring job`, job);
		await this.startScheduler();
		await this.scheduler.every(job.interval, job.id, job.data || {});
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
		const matcher = new RegExp(`_${ appId }$`);
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
