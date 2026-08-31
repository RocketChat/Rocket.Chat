import type { ILivechatBusinessHour, LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import type { Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IWorkHoursCronJobsItem {
	day: string;
	times: string[];
}

export interface IWorkHoursCronJobsWrapper {
	start: IWorkHoursCronJobsItem[];
	finish: IWorkHoursCronJobsItem[];
}

export interface ILivechatBusinessHoursModel extends IBaseModel<ILivechatBusinessHour> {
	findActiveBusinessHours<
		T extends Document = ILivechatBusinessHour,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		options?: O,
	): Promise<DocumentWithProjection<T, O>[]>;
	findOneDefaultBusinessHour<
		P extends Document = ILivechatBusinessHour,
		O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>,
	>(
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null>;
	findActiveAndOpenBusinessHoursByDay<
		T extends Document = ILivechatBusinessHour,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		day: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O>[]>;
	findDefaultActiveAndOpenBusinessHoursByDay(day: string, options?: any): Promise<ILivechatBusinessHour[]>;
	insertOne(data: Omit<ILivechatBusinessHour, '_id' | '_updatedAt'>): Promise<any>;
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

	disableBusinessHour(businessHourId: string): Promise<any>;
}
