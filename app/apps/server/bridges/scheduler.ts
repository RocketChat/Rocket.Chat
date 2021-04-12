import Agenda from 'agenda';
import { MongoInternals } from 'meteor/mongo';
import {
	StartupType,
	IProcessor,
	IOnetimeSchedule,
	IRecurringSchedule,
} from '@rocket.chat/apps-engine/definition/scheduler';
import { SchedulerBridge } from '@rocket.chat/apps-engine/server/bridges/SchedulerBridge';

import { AppServerOrchestrator } from '../orchestrator';

function _callProcessor(processor: Function): (job: { attrs?: { data: object } }) => object {
	return (job): Function => processor(job?.attrs?.data || {});
}

export class AppSchedulerBridge extends SchedulerBridge {
	private isConnected: boolean;

	private scheduler: Agenda;

	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
		this.scheduler = new Agenda({
			mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
			db: { collection: 'rocketchat_apps_scheduler' },
			// this ensures the same job doesn't get executed multiple times in a cluster
			defaultConcurrency: 1,
		});
		this.isConnected = false;
	}

	protected async registerProcessors(processors: Array<IProcessor> = [], appId: string): Promise<void> {
		const runAfterRegister: Promise<void>[] = [];
		this.orch.debugLog(`The App ${ appId } is registering job processors`, processors);
		processors.forEach(({ id, processor, startupSetting }: IProcessor) => {
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

	protected async scheduleOnce(job: IOnetimeSchedule, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${ appId } is scheduling an onetime job`, job);
		await this.startScheduler();
		await this.scheduler.schedule(job.when, job.id, job.data || {});
	}

	private async scheduleOnceAfterRegister(job: IOnetimeSchedule, appId: string): Promise<void> {
		const scheduledJobs = await this.scheduler.jobs({ name: job.id, type: 'normal' });
		if (!scheduledJobs.length) {
			await this.scheduleOnce(job, appId);
		}
	}

	protected async scheduleRecurring(job: IRecurringSchedule, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${ appId } is scheduling a recurring job`, job);
		await this.startScheduler();
		await this.scheduler.every(job.interval, job.id, job.data || {});
	}

	protected async cancelJob(jobId: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${ appId } is canceling a job`, jobId);
		await this.startScheduler();
		try {
			await this.scheduler.cancel({ name: jobId });
		} catch (e) {
			console.error(e);
		}
	}

	protected async cancelAllJobs(appId: string): Promise<void> {
		this.orch.debugLog(`Canceling all jobs of App ${ appId }`);
		await this.startScheduler();
		const matcher = new RegExp(`_${ appId }$`);
		try {
			await this.scheduler.cancel({ name: { $regex: matcher } });
		} catch (e) {
			console.error(e);
		}
	}

	private async startScheduler(): Promise<void> {
		if (!this.isConnected) {
			await this.scheduler.start();
			this.isConnected = true;
		}
	}
}
