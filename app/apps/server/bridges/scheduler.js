import Agenda from 'agenda';
import { MongoInternals } from 'meteor/mongo';
import { StartupType } from '@rocket.chat/apps-engine/definition/scheduler';

function _callProcessor(processor) {
	return (job) => processor(job?.attrs?.data || {});
}

/**
 * Provides the Apps Engine with task scheduling capabilities
 * It uses {@link agenda:github.com/agenda/agenda} as backend
 */
export class AppSchedulerBridge {
	constructor(orch) {
		this.orch = orch;
		this.scheduler = new Agenda({
			mongo: MongoInternals.defaultRemoteCollectionDriver().mongo.client.db(),
			db: { collection: 'rocketchat_apps_scheduler' },
			// this ensures the same job doesn't get executed multiple times in a cluster
			defaultConcurrency: 1,
		});
		this.listenToSchedulerEvents();
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
						this.orch.getRocketChatLogger().error(`Invalid startup setting type (${ startupSetting.type }) for the processor ${ id }`);
						break;
				}
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
	async scheduleOnce(job, appId) {
		this.orch.debugLog(`The App ${ appId } is scheduling an onetime job`, job);
		try {
			await this.startScheduler();
			await this.scheduler.schedule(job.when, job.id, job.data || {});
		} catch (e) {
			this.orch.getRocketChatLogger().error(e);
		}
	}

	async scheduleOnceAfterRegister(job, appId) {
		const scheduledJobs = await this.scheduler.jobs({ name: job.id, type: 'normal' });
		if (!scheduledJobs.length) {
			await this.scheduleOnce(job, appId);
		}
	}

	/**
	 * Schedules a registered processor to run in recurrently according to a given interval
	 *
	 * @param {Object} job
	 * @param {string} job.id The processor's id
	 * @param {string} job.interval When the processor will be re executed
	 * @param {Object} [job.data] An optional object that is passed to the processor
	 * @param {string} appId
	 *
	 * @returns Promise<void>
	 */
	async scheduleRecurring({ id, interval, data }, appId) {
		this.orch.debugLog(`The App ${ appId } is scheduling a recurring job`, id);
		try {
			await this.startScheduler();
			const job = this.scheduler.create(id, data);
			job.repeatEvery(interval, { skipImmediate: true });
			await job.save();
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
	async cancelJob(jobId, appId) {
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
	async cancelAllJobs(appId) {
		this.orch.debugLog(`Canceling all jobs of App ${ appId }`);
		await this.startScheduler();
		const matcher = new RegExp(`_${ appId }$`);
		try {
			await this.scheduler.cancel({ name: { $regex: matcher } });
		} catch (e) {
			this.orch.getRocketChatLogger().error(e);
		}
	}

	async startScheduler() {
		if (!this.isConnected) {
			await this.scheduler.start();
			this.isConnected = true;
		}
	}

	listenToSchedulerEvents() {
		this.scheduler.on('start', (job) => this.orch.debugLog(`Job ${ job.attrs.name } started`));
		this.scheduler.on('complete', (job) => this.orch.debugLog(`Job ${ job.attrs.name } finished`));
		this.scheduler.on('success', (job) => this.orch.debugLog(`Job ${ job.attrs.name } was successful`));
		this.scheduler.on('fail', (job, err) => this.orch.getRocketChatLogger().error(`Job ${ job.attrs.name } has failed: ${ err.message } `));
	}
}
