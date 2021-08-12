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

function _callProcessor(processor: Function): (job: { attrs?: { data: object } }) => void {
	return (job): void => {
		const data = job?.attrs?.data || {};

		// This field is for internal use, no need to leak to app processor
		delete (data as any).appId;

		processor(data);
	};
}

/**
 * Provides the Apps Engine with task scheduling capabilities
 * It uses {@link agenda:github.com/agenda/agenda} as backend
 */
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

	/**
	 * Entity that will be run in a job
	 * @typedef {Object} Processor
	 * @property {string} id The processor's identifier
	 * @property {function} processor The function that will be run on a given schedule
	 * @property {IOnetimeStartup|IRecurrentStartup} [startupSetting] If provided, the processor will be configured with the setting as soon as it gets registered

	 * Processor setting for running once after being registered
	 * @typedef {Object} IOnetimeStartup
	 * @property {string} type=onetime
	 * @property {string} when When the processor will be executed
	 * @property {Object} [data] An optional object that is passed to the processor
	 *
	 * Processor setting for running recurringly after being registered
	 * @typedef {Object} IRecurrentStartup
	 * @property {string} type=recurring
	 * @property {string} interval When the processor will be re executed
	 * @property {Object} [data] An optional object that is passed to the processor
	 */

	/**
	 * Register processors that can be scheduled to run
	 *
	 * @param {Array.<Processor>} processors An array of processors
	 * @param {string} appId
	 *
	 * @returns Promise<void>
	 */
	protected async registerProcessors(processors: Array<IProcessor> = [], appId: string): Promise<void> {
		const runAfterRegister: Promise<void>[] = [];
		this.orch.debugLog(`The App ${ appId } is registering job processors`, processors);
		processors.forEach(({ id, processor, startupSetting }: IProcessor) => {
			this.scheduler.define(id, _callProcessor(processor));

			if (!startupSetting) {
				return;
			}

			switch (startupSetting.type) {
				case StartupType.ONETIME:
					runAfterRegister.push(this.scheduleOnceAfterRegister({ id, when: startupSetting.when, data: startupSetting.data }, appId));
					break;
				case StartupType.RECURRING:
					runAfterRegister.push(this.scheduleRecurring({ id, interval: startupSetting.interval, skipImmediate: startupSetting.skipImmediate, data: startupSetting.data }, appId));
					break;
				default:
					this.orch.getRocketChatLogger().error(`Invalid startup setting type (${ String((startupSetting as any).type) }) for the processor ${ id }`);
					break;
			}
		});

		if (runAfterRegister.length) {
			await Promise.all(runAfterRegister);
		}
	}

	/**
	 * Schedules a registered processor to run _once_.
	 *
	 * @param {Object} job
	 * @param {string} job.id The processor's id
	 * @param {string} job.when When the processor will be executed
	 * @param {Object} [job.data] An optional object that is passed to the processor
	 * @param {string} appId
	 *
	 * @returns Promise<void>
	 */
	protected async scheduleOnce(job: IOnetimeSchedule, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${ appId } is scheduling an onetime job`, job);
		try {
			await this.startScheduler();
			await this.scheduler.schedule(job.when, job.id, this.decorateJobData(job.data, appId));
		} catch (e) {
			this.orch.getRocketChatLogger().error(e);
		}
	}

	private async scheduleOnceAfterRegister(job: IOnetimeSchedule, appId: string): Promise<void> {
		const scheduledJobs = await this.scheduler.jobs({ name: job.id, type: 'normal' });
		if (!scheduledJobs.length) {
			await this.scheduleOnce(job, appId);
		}
	}

	/**
	 * Schedules a registered processor to run recurrently according to a given interval
	 *
	 * @param {Object} job
	 * @param {string} job.id The processor's id
	 * @param {string} job.interval When the processor will be re executed
	 * @param {boolean} job.skipImmediate=false Whether to let the first iteration to execute as soon as the task is registered
	 * @param {Object} [job.data] An optional object that is passed to the processor
	 * @param {string} appId
	 *
	 * @returns Promise<void>
	 */
	protected async scheduleRecurring({ id, interval, skipImmediate = false, data }: IRecurringSchedule, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${ appId } is scheduling a recurring job`, id);
		try {
			await this.startScheduler();
			await this.scheduler.every(interval, id, this.decorateJobData(data, appId), { skipImmediate });
		} catch (e) {
			this.orch.getRocketChatLogger().error(e);
		}
	}

	/**
	 * Cancels a running job given its jobId
	 *
	 * @param {string} jobId
	 * @param {string} appId
	 *
	 * @returns Promise<void>
	 */
	protected async cancelJob(jobId: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${ appId } is canceling a job`, jobId);
		await this.startScheduler();
		try {
			await this.scheduler.cancel({ name: jobId });
		} catch (e) {
			this.orch.getRocketChatLogger().error(e);
		}
	}

	/**
	 * Cancels all the running jobs from the app
	 *
	 * @param {string} appId
	 *
	 * @returns Promise<void>
	 */
	protected async cancelAllJobs(appId: string): Promise<void> {
		this.orch.debugLog(`Canceling all jobs of App ${ appId }`);
		await this.startScheduler();
		const matcher = new RegExp(`_${ appId }$`);
		try {
			await this.scheduler.cancel({ name: { $regex: matcher } });
		} catch (e) {
			this.orch.getRocketChatLogger().error(e);
		}
	}

	private async startScheduler(): Promise<void> {
		if (!this.isConnected) {
			await this.scheduler.start();
			this.isConnected = true;
		}
	}

	private decorateJobData(jobData: object | undefined, appId: string): object {
		return Object.assign({}, jobData, { appId });
	}
}
