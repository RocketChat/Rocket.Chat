import type { Job } from '@rocket.chat/agenda';
import { Agenda } from '@rocket.chat/agenda';
import { ObjectID } from 'bson';
import { MongoInternals } from 'meteor/mongo';
import type { IProcessor, IOnetimeSchedule, IRecurringSchedule, IJobContext } from '@rocket.chat/apps-engine/definition/scheduler';
import { StartupType } from '@rocket.chat/apps-engine/definition/scheduler';
import { SchedulerBridge } from '@rocket.chat/apps-engine/server/bridges/SchedulerBridge';

import type { AppServerOrchestrator } from '../orchestrator';

function _callProcessor(processor: IProcessor['processor']): (job: Job) => Promise<void> {
	return (job) => {
		const data = job?.attrs?.data || {};

		// This field is for internal use, no need to leak to app processor
		delete (data as any).appId;

		data.jobId = job.attrs._id.toString();

		return (processor as (jobContext: IJobContext) => Promise<void>)(data).then(() => {
			// ensure the 'normal' ('onetime' in our vocab) type job is removed after it is run
			// as Agenda does not remove it from the DB
			if (job.attrs.type === 'normal') {
				job.agenda.cancel({ _id: job.attrs._id });
			}
		});
	};
}

/**
 * Provides the Apps Engine with task scheduling capabilities.
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
	 * Register processors that can be scheduled to run
	 *
	 * @param processors An array of processors
	 * @param appId
	 *
	 * @returns List of task ids run at startup, or void no startup run is set
	 */
	protected async registerProcessors(processors: Array<IProcessor> = [], appId: string): Promise<void | Array<string>> {
		const runAfterRegister: Promise<string>[] = [];
		this.orch.debugLog(`The App ${appId} is registering job processors`, processors);
		processors.forEach(({ id, processor, startupSetting }: IProcessor) => {
			this.scheduler.define(id, _callProcessor(processor));

			if (!startupSetting) {
				return;
			}

			switch (startupSetting.type) {
				case StartupType.ONETIME:
					runAfterRegister.push(
						this.scheduleOnceAfterRegister({ id, when: startupSetting.when, data: startupSetting.data }, appId) as Promise<string>,
					);
					break;
				case StartupType.RECURRING:
					runAfterRegister.push(
						this.scheduleRecurring(
							{
								id,
								interval: startupSetting.interval,
								skipImmediate: startupSetting.skipImmediate,
								data: startupSetting.data,
							},
							appId,
						) as Promise<string>,
					);
					break;
				default:
					this.orch
						.getRocketChatLogger()
						.error(`Invalid startup setting type (${String((startupSetting as any).type)}) for the processor ${id}`);
					break;
			}
		});

		if (runAfterRegister.length) {
			return Promise.all(runAfterRegister) as Promise<Array<string>>;
		}
	}

	/**
	 * Schedules a registered processor to run _once_.
	 */
	protected async scheduleOnce({ id, when, data }: IOnetimeSchedule, appId: string): Promise<void | string> {
		this.orch.debugLog(`The App ${appId} is scheduling an onetime job (processor ${id})`);
		try {
			await this.startScheduler();
			const job = await this.scheduler.schedule(when, id, this.decorateJobData(data, appId));
			return job.attrs._id.toString();
		} catch (e) {
			this.orch.getRocketChatLogger().error(e);
		}
	}

	private async scheduleOnceAfterRegister(job: IOnetimeSchedule, appId: string): Promise<void | string> {
		const scheduledJobs = await this.scheduler.jobs({ name: job.id, type: 'normal' }, {}, 1);
		if (!scheduledJobs.length) {
			return this.scheduleOnce(job, appId);
		}
	}

	/**
	 * Schedules a registered processor to run recurrently according to a given interval.
	 *
	 * @param {Object} job
	 * @param {string} job.id The processor's id
	 * @param {string} job.interval When the processor will be re executed
	 * @param {boolean} job.skipImmediate=false Whether to let the first iteration to execute as soon as the task is registered
	 * @param {Object} [job.data] An optional object that is passed to the processor
	 * @param {string} appId
	 *
	 * @returns {string} taskid
	 */
	protected async scheduleRecurring(
		{ id, interval, skipImmediate = false, data }: IRecurringSchedule,
		appId: string,
	): Promise<void | string> {
		this.orch.debugLog(`The App ${appId} is scheduling a recurring job (processor ${id})`);
		try {
			await this.startScheduler();
			const job = await this.scheduler.every(interval, id, this.decorateJobData(data, appId), {
				skipImmediate,
			});
			return job.attrs._id.toString();
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
		this.orch.debugLog(`The App ${appId} is canceling a job`, jobId);
		await this.startScheduler();

		let cancelQuery;
		try {
			cancelQuery = { _id: new ObjectID(jobId.split('_')[0]) };
		} catch (jobDocIdError) {
			// it is not a valid objectid, so it won't try to cancel by document id
			cancelQuery = { name: jobId };
		}

		try {
			await this.scheduler.cancel(cancelQuery);
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
		this.orch.debugLog(`Canceling all jobs of App ${appId}`);
		await this.startScheduler();
		const matcher = new RegExp(`_${appId}$`);
		try {
			await this.scheduler.cancel({ name: { $regex: matcher } });
		} catch (e) {
			this.orch.getRocketChatLogger().error(e);
		}
	}

	public async startScheduler(): Promise<void> {
		if (!this.isConnected) {
			await this.scheduler.start();
			this.isConnected = true;
		}
	}

	private decorateJobData(jobData: object | undefined, appId: string): object {
		return Object.assign({}, jobData, { appId });
	}
}
