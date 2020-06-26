import { Collection, ObjectId } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import {
	IBusinessHourWorkHour,
	ILivechatBusinessHour,
	LivechatBussinessHourTypes,
} from '../../../../definition/ILivechatBusinessHour';

export interface IWorkHoursForCreateCronJobs {
	day: string;
	start: string[];
	finish: string[];
}

export class LivechatBusinessHoursRaw extends BaseRaw {
	public readonly col!: Collection<ILivechatBusinessHour>;

	findOneDefaultBusinessHour(options?: any): Promise<ILivechatBusinessHour> {
		return this.findOne({ type: LivechatBussinessHourTypes.DEFAULT }, options);
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
			type: LivechatBussinessHourTypes.DEFAULT,
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
			ts: new Date(),
			...data,
		});
	}

	async updateOne(_id: string, data: Omit<ILivechatBusinessHour, '_id'>): Promise<any> {
		const query = {
			_id,
		};

		const update = {
			$set: {
				...data,
			},
		};

		return this.col.updateOne(query, update);
	}

	// TODO: Remove this function after remove the deprecated method livechat:saveOfficeHours
	async updateDayOfGlobalBusinessHour(day: Omit<IBusinessHourWorkHour, 'code'>): Promise<any> {
		return this.col.updateOne({
			type: LivechatBussinessHourTypes.DEFAULT,
			'workHours.day': day.day,
		}, {
			$set: {
				'workHours.$.start': day.start,
				'workHours.$.finish': day.finish,
				'workHours.$.open': day.open,
			},
		});
	}

	findHoursToScheduleJobs(): Promise<IWorkHoursForCreateCronJobs[]> {
		return this.col.aggregate([
			{ $match: { active: true } },
			{
				$project: { _id: 0, workHours: 1 },
			},
			{
				$unwind: { path: '$workHours' },
			},
			{ $match: { 'workHours.open': true } },
			{
				$group: {
					_id: { day: '$workHours.start.cron.dayOfWeek' },
					start: { $addToSet: '$workHours.start.cron.time' },
					finish: { $addToSet: '$workHours.finish.cron.time' },
				},
			},
			{
				$project: {
					_id: 0,
					day: '$_id.day',
					start: 1,
					finish: 1,
				},
			},
		]).toArray() as any;
	}

	async findActiveBusinessHoursToOpen(day: string, start: string, type?: LivechatBussinessHourTypes, options?: any): Promise<ILivechatBusinessHour[]> {
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

	async findActiveBusinessHoursToClose(day: string, finish: string, type?: LivechatBussinessHourTypes, options?: any): Promise<ILivechatBusinessHour[]> {
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
