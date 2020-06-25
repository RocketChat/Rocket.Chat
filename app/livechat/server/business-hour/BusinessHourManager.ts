import moment from 'moment';

import { ILivechatBusinessHour, LivechatBussinessHourTypes } from '../../../../definition/ILivechatBusinessHour';
import { ICronJobs } from '../../../utils/server/lib/cron/Cronjobs';
import { IBusinessHour, IBusinessHourBehavior, IBusinessHourType } from './AbstractBusinessHour';
import { settings } from '../../../settings/server';
import { ILivechatDepartment } from '../../../../definition/ILivechatDepartment';
import { callbacks } from '../../../callbacks/server';
import { LivechatDepartment } from '../../../models/server';
import { businessHourManager } from './index';

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
		callbacks.run('onCreateBusinessHourManager', this);
		this.openWorkHoursCallback = this.openWorkHoursCallback.bind(this);
		this.closeWorkHoursCallback = this.closeWorkHoursCallback.bind(this);
	}

	async onStartManager(): Promise<void> {
		await this.createCronJobsForWorkHours();
		this.setupCallbacks();
		this.behavior.onStartBusinessHours();
	}

	async onCloseManager(): Promise<void> {
		console.log('jaj');
		this.removeCronJobs();
		this.clearCronJobsCache();
		await this.behavior.onDisableBusinessHours();
	}

	registerBusinessHourType(businessHourType: IBusinessHourType): void {
		this.types.set(businessHourType.name, businessHourType);
	}

	registerBusinessHourBehavior(behavior: IBusinessHourBehavior): void {
		this.behavior = behavior;
	}

	async getBusinessHour(id?: string, type?: string): Promise<ILivechatBusinessHour | undefined> {
		const businessHourType = this.getBusinessHourType(type as string || LivechatBussinessHourTypes.DEFAULT);
		if (!businessHourType) {
			return;
		}
		return businessHourType.getBusinessHour(id as string);
	}

	async saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void> {
		const type = this.getBusinessHourType(businessHourData.type as string || LivechatBussinessHourTypes.DEFAULT) as IBusinessHourType;
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

	private setupCallbacks(): void {
		callbacks.add('livechat.removeAgentDepartment', this.behavior.onRemoveAgentFromDepartment.bind(this), callbacks.priority.HIGH, 'business-hour-livechat-on-remove-agent-department');
		callbacks.add('livechat.afterRemoveDepartment', this.behavior.onRemoveDepartment.bind(this), callbacks.priority.HIGH, 'business-hour-livechat-after-remove-department');
		callbacks.add('livechat.saveAgentDepartment', this.behavior.onAddAgentToDepartment.bind(this), callbacks.priority.HIGH, 'business-hour-livechat-on-save-agent-department');
	}

	private async createCronJobsForWorkHours(): Promise<void> {
		this.removeCronJobs();
		this.clearCronJobsCache();
		const workHours = await this.behavior.findHoursToCreateJobs();
		workHours.forEach((workHour) => {
			const { start, finish, day } = workHour;
			start.forEach((hour) => {
				const jobName = `${ workHour.day }/${ hour }/open`;
				const time = moment(hour, 'HH:mm');
				const scheduleAt = `${ time.minutes() } ${ time.hours() } * * ${ cronJobDayDict[day] }`;
				this.addToCache(jobName);
				this.cronJobs.add(jobName, scheduleAt, this.openWorkHoursCallback);
			});
			finish.forEach((hour) => {
				const jobName = `${ workHour.day }/${ hour }/open`;
				const time = moment(hour, 'HH:mm');
				const scheduleAt = `${ time.minutes() } ${ time.hours() } * * ${ cronJobDayDict[day] }`;
				this.addToCache(jobName);
				this.cronJobs.add(jobName, scheduleAt, this.closeWorkHoursCallback);
			});
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

// import moment from 'moment';
//
// import { ILivechatBusinessHour } from '../../../../definition/ILivechatBusinessHour';
// import { ICronJobs } from '../../../utils/server/lib/cron/Cronjobs';
// import { IBusinessHour } from './AbstractBusinessHour';
// import { settings } from '../../../settings/server';

// import { ILivechatDepartment } from '../../../../definition/ILivechatDepartment';
//
// const cronJobDayDict: Record<string, number> = {
// 	Sunday: 0,
// 	Monday: 1,
// 	Tuesday: 2,
// 	Wednesday: 3,
// 	Thursday: 4,
// 	Friday: 5,
// 	Saturday: 6,
// };
//
// export class BusinessHourManager {
// 	private businessHour: IBusinessHour;
//
// 	private cronJobs: ICronJobs;
//
// 	private cronJobsCache: string[] = [];
//
// 	constructor() {
// 		this.openWorkHoursCallback = this.openWorkHoursCallback.bind(this);
// 		this.closeWorkHoursCallback = this.closeWorkHoursCallback.bind(this);
// 	}
//
// 	onStartBusinessHourManager(businessHour: IBusinessHour, cronJobs: ICronJobs): void {
// 		this.cronJobs = cronJobs;
// 		this.registerBusinessHourMethod(businessHour);
// 	}
//
// 	registerBusinessHourMethod(businessHour: IBusinessHour): void {
// 		this.businessHour = businessHour;
// 	}
//
// 	async dispatchOnStartTasks(): Promise<void> {
// 		await this.createCronJobsForWorkHours();
// 		await this.openBusinessHoursIfNeeded();
// 	}
//
// 	async dispatchOnCloseTasks(): Promise<void> {
// 		await this.removeBusinessHoursFromAgents();
// 		await this.removeCronJobs();
// 	}
//
// 	async saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void> {
// 		await this.businessHour.saveBusinessHour(businessHourData);
// 		if (!settings.get('Livechat_enable_business_hours')) {
// 			return;
// 		}
// 		await this.dispatchOnStartTasks();
// 	}
//
// 	async getBusinessHour(id?: string): Promise<ILivechatBusinessHour | undefined> {
// 		return this.businessHour.getBusinessHour(id as string);
// 	}
//
// 	async allowAgentChangeServiceStatus(agentId: string): Promise<boolean> {
// 		if (!settings.get('Livechat_enable_business_hours')) {
// 			return true;
// 		}
// 		return this.businessHour.allowAgentChangeServiceStatus(agentId);
// 	}
//
// 	async removeBusinessHourIdFromUsers(department: ILivechatDepartment): Promise<void> {
// 		return this.businessHour.removeBusinessHourFromUsers(department._id, department.businessHourId as string);
// 	}
//
// 	async removeBusinessHourById(id: string): Promise<void> {
// 		await this.businessHour.removeBusinessHourById(id);
// 		if (!settings.get('Livechat_enable_business_hours')) {
// 			return;
// 		}
// 		await this.createCronJobsForWorkHours();
// 		await this.openBusinessHoursIfNeeded();
// 	}
//
// 	async removeBusinessHourFromUsersByIds(userIds: string[], businessHourId: string): Promise<void> {
// 		if (!settings.get('Livechat_enable_business_hours')) {
// 			return;
// 		}
//
// 		await this.businessHour.removeBusinessHourFromUsersByIds(userIds, businessHourId);
// 	}
//
// 	async setDefaultToUsersIfNeeded(userIds: string[]): Promise<void> {
// 		if (!settings.get('Livechat_enable_business_hours')) {
// 			return;
// 		}
//
// 		await this.businessHour.setDefaultToUsersIfNeeded(userIds);
// 	}
//
// 	async addBusinessHourToUsersByIds(userIds: string[], businessHourId: string): Promise<void> {
// 		if (!settings.get('Livechat_enable_business_hours')) {
// 			return;
// 		}
//
// 		await this.businessHour.addBusinessHourToUsersByIds(userIds, businessHourId);
// 	}
//
// 	private removeCronJobs(): void {
// 		this.cronJobsCache.forEach((jobName) => this.cronJobs.remove(jobName));
// 	}
//
// 	private async createCronJobsForWorkHours(): Promise<void> {
// 		this.removeCronJobs();
// 		this.clearCronJobsCache();
// 		const workHours = await this.businessHour.findHoursToCreateJobs();
// 		workHours.forEach((workHour) => {
// 			const { start, finish, day } = workHour;
// 			start.forEach((hour) => {
// 				const jobName = `${ workHour.day }/${ hour }/open`;
// 				const time = moment(hour, 'HH:mm');
// 				const scheduleAt = `${ time.minutes() } ${ time.hours() } * * ${ cronJobDayDict[day] }`;
// 				this.addToCache(jobName);
// 				this.cronJobs.add(jobName, scheduleAt, this.openWorkHoursCallback);
// 			});
// 			finish.forEach((hour) => {
// 				const jobName = `${ workHour.day }/${ hour }/open`;
// 				const time = moment(hour, 'HH:mm');
// 				const scheduleAt = `${ time.minutes() } ${ time.hours() } * * ${ cronJobDayDict[day] }`;
// 				this.addToCache(jobName);
// 				this.cronJobs.add(jobName, scheduleAt, this.closeWorkHoursCallback);
// 			});
// 		});
// 	}
//
// 	private async removeBusinessHoursFromAgents(): Promise<void> {
// 		return this.businessHour.removeBusinessHoursFromUsers();
// 	}
//
// 	private async openBusinessHoursIfNeeded(): Promise<void> {
// 		return this.businessHour.openBusinessHoursIfNeeded();
// 	}
//
// 	private async openWorkHoursCallback(day: string, hour: string): Promise<void> {
// 		return this.businessHour.openBusinessHoursByDayHour(day, hour);
// 	}
//
// 	private async closeWorkHoursCallback(day: string, hour: string): Promise<void> {
// 		return this.businessHour.closeBusinessHoursByDayAndHour(day, hour);
// 	}
//
// 	private addToCache(jobName: string): void {
// 		this.cronJobsCache.push(jobName);
// 	}
//
// 	private clearCronJobsCache(): void {
// 		this.cronJobsCache = [];
// 	}
// }
