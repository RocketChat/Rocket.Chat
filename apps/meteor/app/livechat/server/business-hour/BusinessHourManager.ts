import moment from 'moment';
import { LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import type { ICronJobs, ILivechatBusinessHour } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import type { IBusinessHourBehavior, IBusinessHourType } from './AbstractBusinessHour';
import { settings } from '../../../settings/server';
import { callbacks } from '../../../../lib/callbacks';

const cronJobDayDict: Record<string, number> = {
	Sunday: 0,
	Monday: 1,
	Tuesday: 2,
	Wednesday: 3,
	Thursday: 4,
	Friday: 5,
	Saturday: 6,
};

export class BusinessHourManager {
	private types: Map<string, IBusinessHourType> = new Map();

	private behavior: IBusinessHourBehavior;

	private cronJobs: ICronJobs;

	private cronJobsCache: string[] = [];

	constructor(cronJobs: ICronJobs) {
		this.cronJobs = cronJobs;
		this.openWorkHoursCallback = this.openWorkHoursCallback.bind(this);
		this.closeWorkHoursCallback = this.closeWorkHoursCallback.bind(this);
	}

	async startManager(): Promise<void> {
		await this.createCronJobsForWorkHours();
		this.setupCallbacks();
		this.behavior.onStartBusinessHours();
	}

	async stopManager(): Promise<void> {
		this.removeCronJobs();
		this.clearCronJobsCache();
		this.removeCallbacks();
		await this.behavior.onDisableBusinessHours();
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
	}

	private removeCallbacks(): void {
		callbacks.remove('livechat.removeAgentDepartment', 'business-hour-livechat-on-remove-agent-department');
		callbacks.remove('livechat.afterRemoveDepartment', 'business-hour-livechat-after-remove-department');
		callbacks.remove('livechat.saveAgentDepartment', 'business-hour-livechat-on-save-agent-department');
	}

	private async createCronJobsForWorkHours(): Promise<void> {
		this.removeCronJobs();
		this.clearCronJobsCache();
		const [workHours] = await this.behavior.findHoursToCreateJobs();
		if (!workHours) {
			return;
		}

		const { start, finish } = workHours;
		start.forEach(({ day, times }) => this.scheduleCronJob(times, day, 'open', this.openWorkHoursCallback));
		finish.forEach(({ day, times }) => this.scheduleCronJob(times, day, 'close', this.closeWorkHoursCallback));
	}

	private scheduleCronJob(items: string[], day: string, type: string, job: (day: string, hour: string) => void): void {
		items.forEach((hour) => {
			const jobName = `${day}/${hour}/${type}`;
			const time = moment(hour, 'HH:mm');
			const scheduleAt = `${time.minutes()} ${time.hours()} * * ${cronJobDayDict[day]}`;
			this.addToCache(jobName);
			this.cronJobs.add(jobName, scheduleAt, job);
		});
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

	private removeCronJobs(): void {
		this.cronJobsCache.forEach((jobName) => this.cronJobs.remove(jobName));
	}

	private addToCache(jobName: string): void {
		this.cronJobsCache.push(jobName);
	}

	private clearCronJobsCache(): void {
		this.cronJobsCache = [];
	}
}
