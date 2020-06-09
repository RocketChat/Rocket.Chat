import moment from 'moment';

import { ILivechatBusinessHour } from '../../../../definition/ILivechatBusinessHour';
import { ICronJobs } from '../../../utils/server/lib/cron/Cronjobs';
import { IBusinessHour } from './AbstractBusinessHour';
import { IWorkHoursForCreateCronJobs } from '../../../models/server/raw/LivechatBusinessHours';

export interface IBusinessHoursManager {
	saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void>;
	getBusinessHour(id?: string): Promise<ILivechatBusinessHour>;
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
	}

	registerBusinessHourMethod(businessHour: IBusinessHour): void {
		this.businessHour = businessHour;
	}

	async saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void> {
		businessHourData.workHours.forEach((hour) => {
			hour.start = moment(hour.start, 'HH:mm').utc().format('HH:mm');
			hour.finish = moment(hour.finish, 'HH:mm').utc().format('HH:mm');
		});
		this.businessHour.saveBusinessHour(businessHourData);
		this.createCronJobsForWorkHours(businessHourData, await this.businessHour.findHoursToCreateJobs());
	}

	async getBusinessHour(id?: string): Promise<ILivechatBusinessHour> {
		return this.businessHour.getBusinessHour(id as string);
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

	private async openWorkHoursCallback(hour: string): void {
		console.log('open:', hour);
	}

	private async closeWorkHoursCallback(hour: string): void {
		console.log('CLOSE', hour);
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
