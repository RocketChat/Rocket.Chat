import type { ILivechatBusinessHour, IBusinessHourTimezone } from '@rocket.chat/core-typings';
import { LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import type { AgendaCronJobs } from '@rocket.chat/cron';
import { LivechatBusinessHours, LivechatDepartment, Users } from '@rocket.chat/models';
import moment from 'moment';

import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';
import { businessHourLogger } from '../lib/logger';
import type { IBusinessHourBehavior, IBusinessHourType } from './AbstractBusinessHour';
import { closeBusinessHour } from './closeBusinessHour';

const CRON_EVERY_MIDNIGHT_EXPRESSION = '0 0 * * *';
const CRON_DAYLIGHT_JOB_NAME = 'livechat-business-hour-daylight-saving-time-verifier';

export class BusinessHourManager {
	private types: Map<string, IBusinessHourType> = new Map();

	private behavior: IBusinessHourBehavior;

	private cronJobs: AgendaCronJobs;

	private cronJobsCache: string[] = [];

	constructor(cronJobs: AgendaCronJobs) {
		this.cronJobs = cronJobs;
		this.openWorkHoursCallback = this.openWorkHoursCallback.bind(this);
		this.closeWorkHoursCallback = this.closeWorkHoursCallback.bind(this);
	}

	async startManager(): Promise<void> {
		await this.createCronJobsForWorkHours();
		this.setupCallbacks();
		await this.cleanupDisabledDepartmentReferences();
		await this.behavior.onStartBusinessHours();
		void this.startDaylightSavingTimeVerifier();
		void this.registerDaylightSavingTimeCronJob();
	}

	async stopManager(): Promise<void> {
		await this.removeCronJobs();
		this.clearCronJobsCache();
		this.removeCallbacks();
		await this.behavior.onDisableBusinessHours();
		await this.cronJobs.remove(CRON_DAYLIGHT_JOB_NAME);
	}

	async restartManager(): Promise<void> {
		await this.stopManager();
		await this.startManager();
	}

	async cleanupDisabledDepartmentReferences(): Promise<void> {
		// Get business hours with departments enabled and disabled
		const bhWithDepartments = await LivechatDepartment.getBusinessHoursWithDepartmentStatuses();

		if (!bhWithDepartments.length) {
			// If there are no bh, skip
			return;
		}

		for await (const { _id: businessHourId, validDepartments, invalidDepartments } of bhWithDepartments) {
			if (!invalidDepartments.length) {
				continue;
			}

			// If there are no enabled departments, close the business hour
			const allDepsAreDisabled = validDepartments.length === 0 && invalidDepartments.length > 0;
			if (allDepsAreDisabled) {
				const businessHour = await this.getBusinessHour(businessHourId, LivechatBusinessHourTypes.CUSTOM);
				if (!businessHour) {
					continue;
				}
				await closeBusinessHour(businessHour);
			}

			// Remove business hour from disabled departments
			await LivechatDepartment.removeBusinessHourFromDepartmentsByIdsAndBusinessHourId(invalidDepartments, businessHourId);
		}
	}

	async allowAgentChangeServiceStatus(agentId: string): Promise<boolean> {
		if (!settings.get('Livechat_enable_business_hours')) {
			return true;
		}
		return this.behavior.allowAgentChangeServiceStatus(agentId);
	}

	registerBusinessHourType(businessHourType: IBusinessHourType): void {
		this.types.set(businessHourType.name, businessHourType);
	}

	registerBusinessHourBehavior(behavior: IBusinessHourBehavior): void {
		this.behavior = behavior;
	}

	async getBusinessHour(id?: string, type?: string): Promise<ILivechatBusinessHour | null> {
		const businessHourType = this.getBusinessHourType((type as string) || LivechatBusinessHourTypes.DEFAULT);
		if (!businessHourType) {
			return null;
		}
		return businessHourType.getBusinessHour(id);
	}

	async saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void> {
		const type = this.getBusinessHourType((businessHourData.type as string) || LivechatBusinessHourTypes.DEFAULT) as IBusinessHourType;
		const saved = await type.saveBusinessHour(businessHourData);
		if (!settings.get('Livechat_enable_business_hours')) {
			return;
		}
		await this.behavior.afterSaveBusinessHours(saved);
		await this.createCronJobsForWorkHours();
	}

	async removeBusinessHourByIdAndType(id: string, type: string): Promise<void> {
		const businessHourType = this.getBusinessHourType(type) as IBusinessHourType;
		await businessHourType.removeBusinessHourById(id);
		if (!settings.get('Livechat_enable_business_hours')) {
			return;
		}
		await this.createCronJobsForWorkHours();
	}

	async onLogin(agentId: string): Promise<any> {
		if (!settings.get('Livechat_enable_business_hours')) {
			return this.behavior.changeAgentActiveStatus(agentId, 'available');
		}

		return Users.setLivechatStatusActiveBasedOnBusinessHours(agentId);
	}

	async restartCronJobsIfNecessary(): Promise<void> {
		if (!settings.get('Livechat_enable_business_hours')) {
			return;
		}

		await this.createCronJobsForWorkHours();
	}

	private setupCallbacks(): void {
		callbacks.add(
			'livechat.removeAgentDepartment',
			this.behavior.onRemoveAgentFromDepartment.bind(this),
			callbacks.priority.HIGH,
			'business-hour-livechat-on-remove-agent-department',
		);
		callbacks.add(
			'livechat.afterRemoveDepartment',
			this.behavior.onRemoveDepartment.bind(this),
			callbacks.priority.HIGH,
			'business-hour-livechat-after-remove-department',
		);
		callbacks.add(
			'livechat.saveAgentDepartment',
			this.behavior.onAddAgentToDepartment.bind(this),
			callbacks.priority.HIGH,
			'business-hour-livechat-on-save-agent-department',
		);
		callbacks.add(
			'livechat.afterDepartmentDisabled',
			this.behavior.onDepartmentDisabled.bind(this),
			callbacks.priority.HIGH,
			'business-hour-livechat-on-department-disabled',
		);
		callbacks.add(
			'livechat.afterDepartmentArchived',
			this.behavior.onDepartmentArchived.bind(this),
			callbacks.priority.HIGH,
			'business-hour-livechat-on-department-archived',
		);
		callbacks.add(
			'livechat.onNewAgentCreated',
			this.behavior.onNewAgentCreated.bind(this),
			callbacks.priority.HIGH,
			'business-hour-livechat-on-agent-created',
		);
	}

	private removeCallbacks(): void {
		callbacks.remove('livechat.removeAgentDepartment', 'business-hour-livechat-on-remove-agent-department');
		callbacks.remove('livechat.afterRemoveDepartment', 'business-hour-livechat-after-remove-department');
		callbacks.remove('livechat.saveAgentDepartment', 'business-hour-livechat-on-save-agent-department');
		callbacks.remove('livechat.afterDepartmentDisabled', 'business-hour-livechat-on-department-disabled');
		callbacks.remove('livechat.afterDepartmentArchived', 'business-hour-livechat-on-department-archived');
		callbacks.remove('livechat.onNewAgentCreated', 'business-hour-livechat-on-agent-created');
	}

	private async createCronJobsForWorkHours(): Promise<void> {
		await this.removeCronJobs();
		this.clearCronJobsCache();
		const [workHours] = await this.behavior.findHoursToCreateJobs();
		if (!workHours) {
			return;
		}

		const { start, finish } = workHours;

		await Promise.all(start.map(({ day, times }) => this.scheduleCronJob(times, day, 'open', this.openWorkHoursCallback)));
		await Promise.all(finish.map(({ day, times }) => this.scheduleCronJob(times, day, 'close', this.closeWorkHoursCallback)));
	}

	private async scheduleCronJob(
		items: string[],
		day: string,
		type: 'open' | 'close',
		job: (day: string, hour: string) => void,
	): Promise<void> {
		await Promise.all(
			items.map((hour) => {
				const time = moment(hour, 'HH:mm').day(day);
				const jobName = `${time.format('dddd')}/${time.format('HH:mm')}/${type}`;
				const scheduleAt = `${time.minutes()} ${time.hours()} * * ${time.day()}`;
				this.addToCache(jobName);
				return this.cronJobs.add(jobName, scheduleAt, () => job(day, hour));
			}),
		);
	}

	private async openWorkHoursCallback(day: string, hour: string): Promise<void> {
		return this.behavior.openBusinessHoursByDayAndHour(day, hour);
	}

	private async closeWorkHoursCallback(day: string, hour: string): Promise<void> {
		return this.behavior.closeBusinessHoursByDayAndHour(day, hour);
	}

	private getBusinessHourType(type: string): IBusinessHourType | undefined {
		return this.types.get(type);
	}

	private async removeCronJobs(): Promise<void> {
		await Promise.all(this.cronJobsCache.map((jobName) => this.cronJobs.remove(jobName)));
	}

	private addToCache(jobName: string): void {
		this.cronJobsCache.push(jobName);
	}

	private clearCronJobsCache(): void {
		this.cronJobsCache = [];
	}

	hasDaylightSavingTimeChanged(timezone: IBusinessHourTimezone): boolean {
		const now = moment().utc().tz(timezone.name);
		const currentUTC = now.format('Z');
		const existingTimezoneUTC = moment(timezone.utc, 'Z').utc().tz(timezone.name);
		const DSTHasChanged = !moment(currentUTC, 'Z').utc().tz(timezone.name).isSame(existingTimezoneUTC);

		return currentUTC !== timezone.utc && DSTHasChanged;
	}

	async registerDaylightSavingTimeCronJob(): Promise<void> {
		await this.cronJobs.add(CRON_DAYLIGHT_JOB_NAME, CRON_EVERY_MIDNIGHT_EXPRESSION, this.startDaylightSavingTimeVerifier.bind(this));
	}

	async startDaylightSavingTimeVerifier(): Promise<void> {
		const activeBusinessHours = await LivechatBusinessHours.findActiveBusinessHours();
		const timezonesNeedingAdjustment = activeBusinessHours.filter(
			({ timezone }) => timezone && this.hasDaylightSavingTimeChanged(timezone),
		);
		if (timezonesNeedingAdjustment.length === 0) {
			return;
		}
		const result = await Promise.allSettled(
			timezonesNeedingAdjustment.map((businessHour) => {
				const businessHourType = this.getBusinessHourType(businessHour.type);
				if (!businessHourType) {
					return;
				}

				return businessHourType.saveBusinessHour({
					...businessHour,
					timezoneName: businessHour.timezone.name,
					workHours: businessHour.workHours.map((hour) => ({ ...hour, start: hour.start.time, finish: hour.finish.time })) as Record<
						string,
						any
					>[],
				} as ILivechatBusinessHour & { timezoneName: string });
			}),
		);
		const failed = result.filter((r) => r.status === 'rejected');
		if (failed.length > 0) {
			failed.forEach((error: any) => {
				businessHourLogger.error('Failed to update business hours with new timezone', error.reason);
			});
		}

		await this.createCronJobsForWorkHours();
	}
}
