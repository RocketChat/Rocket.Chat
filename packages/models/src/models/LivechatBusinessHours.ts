import type { ILivechatBusinessHour, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import { LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import type { ILivechatBusinessHoursModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { Collection, Db, Document } from 'mongodb';

import { BaseRaw } from './BaseRaw';

interface IWorkHoursCronJobsItem {
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

	findOneDefaultBusinessHour<
		P extends Document = ILivechatBusinessHour,
		O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>,
	>(options?: O): Promise<DocumentWithProjection<P, O> | null> {
		return this.findOne<P, O>({ type: LivechatBusinessHourTypes.DEFAULT }, options);
	}

	findActiveAndOpenBusinessHoursByDay<
		T extends Document = ILivechatBusinessHour,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(day: string, options?: O): Promise<DocumentWithProjection<T, O>[]> {
		return this.find<T, O>(
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

	findActiveBusinessHours<
		T extends Document = ILivechatBusinessHour,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(options?: O): Promise<DocumentWithProjection<T, O>[]> {
		return this.find<T, O>(
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
						$or: [{ 'start.cron.dayOfWeek': day }, { 'finish.cron.dayOfWeek': day }],
						open: true,
					},
				},
			},
			options,
		).toArray();
	}

	override async insertOne(data: Omit<ILivechatBusinessHour, '_id' | '_updatedAt'>): Promise<any> {
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

	disableBusinessHour(businessHourId: string): Promise<any> {
		return this.updateOne({ _id: businessHourId }, { $set: { active: false } });
	}
}
