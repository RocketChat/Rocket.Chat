import type { FindOptions } from 'mongodb';
import type { ILivechatBusinessHour, LivechatBusinessHourTypes } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IWorkHoursCronJobsItem {
	day: string;
	times: string[];
}

export interface IWorkHoursCronJobsWrapper {
	start: IWorkHoursCronJobsItem[];
	finish: IWorkHoursCronJobsItem[];
}

export interface ILivechatBusinessHoursModel extends IBaseModel<ILivechatBusinessHour> {
	findOneDefaultBusinessHour(options?: undefined): Promise<ILivechatBusinessHour | null>;
	findOneDefaultBusinessHour(options: FindOptions<ILivechatBusinessHour>): Promise<ILivechatBusinessHour | null>;
	findOneDefaultBusinessHour<P>(options: FindOptions<P extends ILivechatBusinessHour ? ILivechatBusinessHour : P>): Promise<P | null>;
	findOneDefaultBusinessHour<P>(options?: any): Promise<ILivechatBusinessHour | P | null>;
	findActiveAndOpenBusinessHoursByDay(day: string, options?: any): Promise<ILivechatBusinessHour[]>;
	findDefaultActiveAndOpenBusinessHoursByDay(day: string, options?: any): Promise<ILivechatBusinessHour[]>;
	insertOne(data: Omit<ILivechatBusinessHour, '_id'>): Promise<any>;
	findHoursToScheduleJobs(): Promise<IWorkHoursCronJobsWrapper[]>;

	findActiveBusinessHoursToOpen(
		day: string,
		start: string,
		type?: LivechatBusinessHourTypes,
		options?: any,
	): Promise<ILivechatBusinessHour[]>;

	findActiveBusinessHoursToClose(
		day: string,
		finish: string,
		type?: LivechatBusinessHourTypes,
		options?: any,
	): Promise<ILivechatBusinessHour[]>;
}
