import moment from 'moment';

import { ILivechatBusinessHour } from '../../../../definition/ILivechatBusinessHour';
import { ICronJobs } from '../../../utils/server/lib/cron/Cronjobs';
import { IBusinessHour } from './AbstractBusinessHour';
import { IWorkHoursForCreateCronJobs } from '../../../models/server/raw/LivechatBusinessHours';

export interface IBusinessHoursManager {
	saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void>;
	getBusinessHour(id?: string): Promise<ILivechatBusinessHour>;
	allowAgentChangeServiceStatus(agentId: string): Promise<boolean>;
}

const cronJobDayDict: Record<string, number> = {
	Sunday: 0,
	Monday: 1,
	Tuesday: 2,
	Wednesday: 3,
	Thursday: 4,
	Friday: 5,
	Saturday: 6,
};

export class BusinessHourManager implements IBusinessHoursManager {
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
		this.createCronJobsForWorkHours(businessHourData, await this.businessHour.findHoursToCreateJobs());
	}

	async getBusinessHour(id?: string): Promise<ILivechatBusinessHour> {
		return this.businessHour.getBusinessHour(id as string);
	}

	async allowAgentChangeServiceStatus(agentId: string): Promise<boolean> {
		return this.businessHour.allowAgentChangeServiceStatus(agentId);
	}

	private createCronJobsForWorkHours(businessHourData: ILivechatBusinessHour, workHours: IWorkHoursForCreateCronJobs[]): void {
		this.removeCronJobs();
		this.clearCronJobsCache();
		workHours.forEach((workHour) => {
			const { start, finish, day } = workHour;
			start.forEach((hour) => {
				const jobName = `${ workHour.day }-${ hour }`;
				const duration = moment.duration(hour).add(businessHourData.timezone.utc, 'hours');
				const scheduleAt = `${ duration.minutes() } ${ duration.hours() } * * ${ cronJobDayDict[day] }`;
				this.addToCache(jobName);
				this.cronJobs.add(jobName, scheduleAt, this.openWorkHoursCallback);
			});
			finish.forEach((hour) => {
				const jobName = `${ workHour.day }-${ hour }`;
				const duration = moment.duration(hour).add(businessHourData.timezone.utc, 'hours');
				const scheduleAt = `${ duration.minutes() } ${ duration.hours() } * * ${ cronJobDayDict[day] }`;
				this.addToCache(jobName);
				this.cronJobs.add(jobName, scheduleAt, this.closeWorkHoursCallback);
			});
		});
	}

	private async openWorkHoursCallback(day: string, hour: string): Promise<void> {
		this.businessHour.openBusinessHoursByDayAndHour(day, hour);
	}

	private async closeWorkHoursCallback(day: string, hour: string): Promise<void> {
		this.businessHour.closeBusinessHoursByDayAndHour(day, hour);
	}

	private addToCache(jobName: string): void {
		this.cronJobsCache.push(jobName);
	}

	private removeCronJobs(): void {
		this.cronJobsCache.forEach((jobName) => this.cronJobs.remove(jobName));
	}

	private clearCronJobsCache(): void {
		this.cronJobsCache = [];
	}
}
