import type { ILivechatBusinessHoursModel } from '@rocket.chat/model-typings';
import type { Collection, Db, FindOptions } from 'mongodb';
import type { ILivechatBusinessHour, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import { LivechatBusinessHourTypes } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';

export interface IWorkHoursCronJobsItem {
	day: string;
	times: string[];
}

export interface IWorkHoursCronJobsWrapper {
	start: IWorkHoursCronJobsItem[];
	finish: IWorkHoursCronJobsItem[];
}

export class LivechatBusinessHoursRaw extends BaseRaw<ILivechatBusinessHour> implements ILivechatBusinessHoursModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatBusinessHour>>) {
		super(db, 'livechat_business_hours', trash);
	}

	async findOneDefaultBusinessHour(options?: undefined): Promise<ILivechatBusinessHour | null>;

	async findOneDefaultBusinessHour(options: FindOptions<ILivechatBusinessHour>): Promise<ILivechatBusinessHour | null>;

	async findOneDefaultBusinessHour<P>(options: FindOptions<P extends ILivechatBusinessHour ? ILivechatBusinessHour : P>): Promise<P | null>;

	findOneDefaultBusinessHour<P>(options?: any): Promise<ILivechatBusinessHour | P | null> {
		return this.findOne({ type: LivechatBusinessHourTypes.DEFAULT }, options);
	}

	findActiveAndOpenBusinessHoursByDay(day: string, options?: any): Promise<ILivechatBusinessHour[]> {
		return this.find(
			{
				active: true,
				workHours: {
					$elemMatch: {
						$or: [{ 'start.cron.dayOfWeek': day }, { 'finish.cron.dayOfWeek': day }],
						open: true,
					},
				},
			},
			options,
		).toArray();
	}

	findActiveBusinessHours(options: FindOptions<ILivechatBusinessHour> = {}): Promise<ILivechatBusinessHour[]> {
		return this.find(
			{
				active: true,
			},
			options,
		).toArray();
	}

	findDefaultActiveAndOpenBusinessHoursByDay(day: string, options?: any): Promise<ILivechatBusinessHour[]> {
		return this.find(
			{
				type: LivechatBusinessHourTypes.DEFAULT,
				active: true,
				workHours: {
					$elemMatch: {
						$or: [{ 'start.cron.dayOfWeek': day, 'finish.cron.dayOfWeek': day }],
						open: true,
					},
				},
			},
			options,
		).toArray();
	}

	async insertOne(data: Omit<ILivechatBusinessHour, '_id'>): Promise<any> {
		return super.insertOne({
			...data,
			ts: new Date(),
		});
	}

	findHoursToScheduleJobs(): Promise<IWorkHoursCronJobsWrapper[]> {
		return this.col
			.aggregate([
				{
					$facet: {
						start: [
							{ $match: { active: true } },
							{ $project: { _id: 0, workHours: 1 } },
							{ $unwind: { path: '$workHours' } },
							{ $match: { 'workHours.open': true } },
							{
								$group: {
									_id: { day: '$workHours.start.cron.dayOfWeek' },
									times: { $addToSet: '$workHours.start.cron.time' },
								},
							},
							{
								$project: {
									_id: 0,
									day: '$_id.day',
									times: 1,
								},
							},
						],
						finish: [
							{ $match: { active: true } },
							{ $project: { _id: 0, workHours: 1 } },
							{ $unwind: { path: '$workHours' } },
							{ $match: { 'workHours.open': true } },
							{
								$group: {
									_id: { day: '$workHours.finish.cron.dayOfWeek' },
									times: { $addToSet: '$workHours.finish.cron.time' },
								},
							},
							{
								$project: {
									_id: 0,
									day: '$_id.day',
									times: 1,
								},
							},
						],
					},
				},
			])
			.toArray() as any;
	}

	async findActiveBusinessHoursToOpen(
		day: string,
		start: string,
		type?: LivechatBusinessHourTypes,
		options?: any,
	): Promise<ILivechatBusinessHour[]> {
		const query: Record<string, any> = {
			active: true,
			workHours: {
				$elemMatch: {
					'start.cron.dayOfWeek': day,
					'start.cron.time': start,
					'open': true,
				},
			},
		};
		if (type) {
			query.type = type;
		}
		return this.col.find(query, options).toArray();
	}

	async findActiveBusinessHoursToClose(
		day: string,
		finish: string,
		type?: LivechatBusinessHourTypes,
		options?: any,
	): Promise<ILivechatBusinessHour[]> {
		const query: Record<string, any> = {
			active: true,
			workHours: {
				$elemMatch: {
					'finish.cron.dayOfWeek': day,
					'finish.cron.time': finish,
					'open': true,
				},
			},
		};
		if (type) {
			query.type = type;
		}
		return this.col.find(query, options).toArray();
	}
}
