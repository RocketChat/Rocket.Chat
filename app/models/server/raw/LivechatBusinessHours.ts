import { Collection, FindOneOptions, ObjectId, WithoutProjection } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import {
	IBusinessHourWorkHour,
	ILivechatBusinessHour,
	LivechatBusinessHourTypes,
} from '../../../../definition/ILivechatBusinessHour';

export interface IWorkHoursCronJobsItem {
	day: string;
	times: string[];
}

export interface IWorkHoursCronJobsWrapper {
	start: IWorkHoursCronJobsItem[];
	finish: IWorkHoursCronJobsItem[];
}

export class LivechatBusinessHoursRaw extends BaseRaw<ILivechatBusinessHour> {
	public readonly col!: Collection<ILivechatBusinessHour>;

	async findOneDefaultBusinessHour(options?: undefined): Promise<ILivechatBusinessHour | null>;

	async findOneDefaultBusinessHour(options: WithoutProjection<FindOneOptions<ILivechatBusinessHour>>): Promise<ILivechatBusinessHour | null>;

	async findOneDefaultBusinessHour<P>(options: FindOneOptions<P extends ILivechatBusinessHour ? ILivechatBusinessHour : P>): Promise<P | null>;

	findOneDefaultBusinessHour<P>(options?: any): Promise<ILivechatBusinessHour | P | null> {
		return this.findOne({ type: LivechatBusinessHourTypes.DEFAULT }, options);
	}

	findActiveAndOpenBusinessHoursByDay(day: string, options?: any): Promise<ILivechatBusinessHour[]> {
		return this.find({
			active: true,
			workHours: {
				$elemMatch: {
					$or: [{ 'start.cron.dayOfWeek': day, 'finish.cron.dayOfWeek': day }],
					open: true,
				},
			},
		}, options).toArray();
	}

	findDefaultActiveAndOpenBusinessHoursByDay(day: string, options?: any): Promise<ILivechatBusinessHour[]> {
		return this.find({
			type: LivechatBusinessHourTypes.DEFAULT,
			active: true,
			workHours: {
				$elemMatch: {
					$or: [{ 'start.cron.dayOfWeek': day, 'finish.cron.dayOfWeek': day }],
					open: true,
				},
			},
		}, options).toArray();
	}

	async insertOne(data: Omit<ILivechatBusinessHour, '_id'>): Promise<any> {
		return this.col.insertOne({
			_id: new ObjectId().toHexString(),
			...{ ts: new Date() },
			...data,
		});
	}

	// TODO: Remove this function after remove the deprecated method livechat:saveOfficeHours
	async updateDayOfGlobalBusinessHour(day: Omit<IBusinessHourWorkHour, 'code'>): Promise<any> {
		return this.col.updateOne({
			type: LivechatBusinessHourTypes.DEFAULT,
			'workHours.day': day.day,
		}, {
			$set: {
				'workHours.$.start': day.start,
				'workHours.$.finish': day.finish,
				'workHours.$.open': day.open,
			},
		});
	}

	findHoursToScheduleJobs(): Promise<IWorkHoursCronJobsWrapper[]> {
		return this.col.aggregate([
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
		]).toArray() as any;
	}

	async findActiveBusinessHoursToOpen(day: string, start: string, type?: LivechatBusinessHourTypes, options?: any): Promise<ILivechatBusinessHour[]> {
		const query: Record<string, any> = {
			active: true,
			workHours: {
				$elemMatch: {
					'start.cron.dayOfWeek': day,
					'start.cron.time': start,
					open: true,
				},
			},
		};
		if (type) {
			query.type = type;
		}
		return this.col.find(query, options).toArray();
	}

	async findActiveBusinessHoursToClose(day: string, finish: string, type?: LivechatBusinessHourTypes, options?: any): Promise<ILivechatBusinessHour[]> {
		const query: Record<string, any> = {
			active: true,
			workHours: {
				$elemMatch: {
					'finish.cron.dayOfWeek': day,
					'finish.cron.time': finish,
					open: true,
				},
			},
		};
		if (type) {
			query.type = type;
		}
		return this.col.find(query, options).toArray();
	}
}
