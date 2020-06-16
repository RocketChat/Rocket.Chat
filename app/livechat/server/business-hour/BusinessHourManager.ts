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

	constructor(businessHour: IBusinessHour, cronJobs: ICronJobs) {
		this.cronJobs = cronJobs;
		this.registerBusinessHourMethod(businessHour);
		this.openWorkHoursCallback = this.openWorkHoursCallback.bind(this);
		this.closeWorkHoursCallback = this.closeWorkHoursCallback.bind(this);
	}

	registerBusinessHourMethod(businessHour: IBusinessHour): void {
		this.businessHour = businessHour;
	}

	async saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void> {
		businessHourData.workHours.forEach((hour) => {
			hour.start = moment(hour.start, 'HH:mm').utc().format('HH:mm');
			hour.finish = moment(hour.finish, 'HH:mm').utc().format('HH:mm');
		});
		await this.businessHour.saveBusinessHour(businessHourData);
		if (!settings.get('Livechat_enable_business_hours')) {
			return;
		}
		await this.createCronJobsForWorkHours();
		await this.openBusinessHoursIfNeeded();
	}

	async getBusinessHour(id?: string): Promise<ILivechatBusinessHour> {
		return this.businessHour.getBusinessHour(id as string);
	}

	async allowAgentChangeServiceStatus(agentId: string): Promise<boolean> {
		if (!settings.get('Livechat_enable_business_hours')) {
			return true;
		}
		return this.businessHour.allowAgentChangeServiceStatus(agentId);
	}

	removeCronJobs(): void {
		this.cronJobsCache.forEach((jobName) => this.cronJobs.remove(jobName));
	}

	async createCronJobsForWorkHours(): Promise<void> {
		this.removeCronJobs();
		this.clearCronJobsCache();
		const workHours = await this.businessHour.findHoursToCreateJobs();
		workHours.forEach((workHour) => {
			const { start, finish, day, utc } = workHour;
			start.forEach((hour) => {
				const jobName = `${ workHour.day }/${ hour }/${ utc }/open`;
				const localTime = moment.utc(`${ day }:${ hour }`, 'dddd:HH:mm').add(utc, 'hours');
				const scheduleAt = `${ localTime.minutes() } ${ localTime.hours() } * * ${ cronJobDayDict[day] }`;
				this.addToCache(jobName);
				this.cronJobs.add(jobName, scheduleAt, this.openWorkHoursCallback);
			});
			finish.forEach((hour) => {
				const jobName = `${ workHour.day }/${ hour }/${ utc }/close`;
				const localTime = moment.utc(`${ day }:${ hour }`, 'dddd:HH:mm').add(utc, 'hours');
				const scheduleAt = `${ localTime.minutes() } ${ localTime.hours() } * * ${ cronJobDayDict[day] }`;
				this.addToCache(jobName);
				this.cronJobs.add(jobName, scheduleAt, this.closeWorkHoursCallback);
			});
		});
	}

	async removeBusinessHoursFromAgents(): Promise<void> {
		this.businessHour.removeBusinessHoursFromUsers();
	}

	async openBusinessHoursIfNeeded(): Promise<void> {
		this.businessHour.openBusinessHoursIfNeeded();
	}

	private async openWorkHoursCallback(day: string, hour: string, utc: string): Promise<void> {
		this.businessHour.openBusinessHoursByDayHourAndUTC(day, hour, utc);
	}

	private async closeWorkHoursCallback(day: string, hour: string, utc: string): Promise<void> {
		this.businessHour.closeBusinessHoursByDayAndHour(day, hour, utc);
	}

	private addToCache(jobName: string): void {
		this.cronJobsCache.push(jobName);
	}

	private clearCronJobsCache(): void {
		this.cronJobsCache = [];
	}
}
