import moment from 'moment';

import { ILivechatBusinessHour } from '../../../../definition/ILivechatBusinessHour';
import { ICronJobs } from '../../../utils/server/lib/cron/Cronjobs';
import { IBusinessHour } from './AbstractBusinessHour';
import { settings } from '../../../settings/server';

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
	private businessHour: IBusinessHour;

	private cronJobs: ICronJobs;

	private cronJobsCache: string[] = [];

	constructor() {
		this.openWorkHoursCallback = this.openWorkHoursCallback.bind(this);
		this.closeWorkHoursCallback = this.closeWorkHoursCallback.bind(this);
	}

	onStartBusinessHourManager(businessHour: IBusinessHour, cronJobs: ICronJobs): void {
		this.cronJobs = cronJobs;
		this.registerBusinessHourMethod(businessHour);
	}

	registerBusinessHourMethod(businessHour: IBusinessHour): void {
		this.businessHour = businessHour;
	}

	async dispatchOnStartTasks(): Promise<void> {
		await this.createCronJobsForWorkHours();
		await this.openBusinessHoursIfNeeded();
	}

	async dispatchOnCloseTasks(): Promise<void> {
		await this.removeBusinessHoursFromAgents();
		await this.removeCronJobs();
	}

	async saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void> {
		await this.businessHour.saveBusinessHour(businessHourData);
		if (!settings.get('Livechat_enable_business_hours')) {
			return;
		}
		await this.dispatchOnStartTasks();
	}

	async getBusinessHour(id?: string): Promise<ILivechatBusinessHour | undefined> {
		return this.businessHour.getBusinessHour(id as string);
	}

	async allowAgentChangeServiceStatus(agentId: string): Promise<boolean> {
		if (!settings.get('Livechat_enable_business_hours')) {
			return true;
		}
		return this.businessHour.allowAgentChangeServiceStatus(agentId);
	}

	private removeCronJobs(): void {
		this.cronJobsCache.forEach((jobName) => this.cronJobs.remove(jobName));
	}

	private async createCronJobsForWorkHours(): Promise<void> {
		this.removeCronJobs();
		this.clearCronJobsCache();
		const workHours = await this.businessHour.findHoursToCreateJobs();
		workHours.forEach((workHour) => {
			const { start, finish, day, utc } = workHour;
			start.forEach((hour) => {
				const jobName = `${ workHour.day }/${ hour }/${ utc }/open`;
				const localTime = moment.utc(`${ day }:${ hour }`, 'dddd:HH:mm').add(moment().utcOffset() / 60, 'hours');
				const dayOfTheWeek = parseInt(utc) >= 0 ? localTime.clone().day(localTime.day()).format('dddd') : day;
				const scheduleAt = `${ localTime.minutes() } ${ localTime.hours() } * * ${ cronJobDayDict[dayOfTheWeek] }`;
				this.addToCache(jobName);
				this.cronJobs.add(jobName, scheduleAt, this.openWorkHoursCallback);
			});
			finish.forEach((hour) => {
				const jobName = `${ workHour.day }/${ hour }/${ utc }/close`;
				const localTime = moment.utc(`${ day }:${ hour }`, 'dddd:HH:mm').add(moment().utcOffset() / 60, 'hours');
				const dayOfTheWeek = parseInt(utc) >= 0 ? localTime.clone().day(localTime.day()).format('dddd') : day;
				const scheduleAt = `${ localTime.minutes() } ${ localTime.hours() } * * ${ cronJobDayDict[dayOfTheWeek] }`;
				this.addToCache(jobName);
				this.cronJobs.add(jobName, scheduleAt, this.closeWorkHoursCallback);
			});
		});
	}

	private async removeBusinessHoursFromAgents(): Promise<void> {
		return this.businessHour.removeBusinessHoursFromUsers();
	}

	private async openBusinessHoursIfNeeded(): Promise<void> {
		return this.businessHour.openBusinessHoursIfNeeded();
	}

	async removeBusinessHourById(id: string): Promise<void> {
		await this.businessHour.removeBusinessHourById(id);
		if (!settings.get('Livechat_enable_business_hours')) {
			return;
		}
		await this.createCronJobsForWorkHours();
		await this.openBusinessHoursIfNeeded();
	}

	private async openWorkHoursCallback(day: string, hour: string, utc: string): Promise<void> {
		return this.businessHour.openBusinessHoursByDayHourAndUTC(day, hour, utc);
	}

	private async closeWorkHoursCallback(day: string, hour: string, utc: string): Promise<void> {
		return this.businessHour.closeBusinessHoursByDayAndHour(day, hour, utc);
	}

	private addToCache(jobName: string): void {
		this.cronJobsCache.push(jobName);
	}

	private clearCronJobsCache(): void {
		this.cronJobsCache = [];
	}
}
