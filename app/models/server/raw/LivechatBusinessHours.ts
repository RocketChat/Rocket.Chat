import { Collection, ObjectId } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import {
	IBusinessHourWorkHour,
	ILivechatBusinessHour,
	LivechatBussinessHourTypes,
} from '../../../../definition/ILivechatBusinessHour';
import LivechatBusinessHoursModel from '../models/LivechatBusinessHours';

export interface IWorkHoursForCreateCronJobs {
	day: string;
	start: string[];
	finish: string[];
}

export interface ILivechatBusinessHourRepository {
	insertOne(data: ILivechatBusinessHour): Promise<any>;
	findOneDefaultBusinessHour(): Promise<ILivechatBusinessHour>;
	findHoursToScheduleJobs(): Promise<IWorkHoursForCreateCronJobs[]>;
	updateOne(id: string, data: ILivechatBusinessHour): Promise<any>;
	updateDayOfGlobalBusinessHour(day: IBusinessHourWorkHour): Promise<any>;
}

class LivechatBusinessHoursRaw extends BaseRaw implements ILivechatBusinessHourRepository {
	public readonly col!: Collection<ILivechatBusinessHour>;

	async findOneDefaultBusinessHour(): Promise<ILivechatBusinessHour> {
		return this.findOne({ type: LivechatBussinessHourTypes.SINGLE });
	}

	async insertOne(data: Omit<ILivechatBusinessHour, '_id'>): Promise<any> {
		return this.col.insertOne({
			_id: new ObjectId().toHexString(),
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
			type: LivechatBussinessHourTypes.SINGLE,
			'workHours.day': day.day,
		}, {
			$set: {
				'workHours.$.start': day.start,
				'workHours.$.finish': day.finish,
				'workHours.$.open': day.open,
			},
		});
	}

	async findHoursToScheduleJobs(): Promise<IWorkHoursForCreateCronJobs[]> {
		return await this.col.aggregate([
			{
				$project: { _id: 0, workHours: 1 },
			},
			{
				$unwind: { path: '$workHours' },
			},
			{
				$group: {
					_id: '$workHours.day',
					start: { $addToSet: '$workHours.start' },
					finish: { $addToSet: '$workHours.finish' },
				},
			},
			{
				$project: {
					_id: 0,
					day: '$_id',
					start: 1,
					finish: 1,
				},
			},
		]).toArray() as any;
	}
}

export const LivechatBusinessHours: ILivechatBusinessHourRepository = new LivechatBusinessHoursRaw(LivechatBusinessHoursModel.model.rawCollection());
