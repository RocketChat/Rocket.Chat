import type { ILivechatPriority } from '@rocket.chat/core-typings';
import type { ILivechatPriorityModel } from '@rocket.chat/model-typings';
import type { Db, FindOptions, DeleteResult } from 'mongodb';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

export class LivechatPriorityRaw extends BaseRaw<ILivechatPriority> implements ILivechatPriorityModel {
	constructor(db: Db) {
		super(db, 'livechat_priority');
	}

	findOneByIdOrName(_idOrName: string, options = {}): any {
		const query = {
			$or: [
				{
					_id: _idOrName,
				},
				{
					name: _idOrName,
				},
			],
		};

		return this.findOne(query, options);
	}

	findOneById(_id: string, options: FindOptions<ILivechatPriority>): Promise<ILivechatPriority | null> {
		const query = { _id };

		return this.findOne(query, options);
	}

	async createOrUpdatePriority(
		_id: string,
		{
			name,
			description,
			color,
			dueTimeInMinutes,
		}: Omit<ILivechatPriority, 'dueTimeInMinutes'> & { dueTimeInMinutes: string; color: string },
	): Promise<Omit<ILivechatPriority, '_updatedAt'>> {
		const record = {
			name,
			description,
			color,
			dueTimeInMinutes: parseInt(dueTimeInMinutes, 10),
		};

		if (_id) {
			await this.updateOne({ _id }, { $set: record });
		} else {
			_id = (await this.insertOne(record)).insertedId;
		}

		return Object.assign(record, { _id });
	}

	removeById(_id: string): Promise<DeleteResult> {
		const query = { _id };

		return this.deleteOne(query);
	}
}
