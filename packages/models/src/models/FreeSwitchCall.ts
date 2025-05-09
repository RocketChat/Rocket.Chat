import type { IFreeSwitchCall, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IFreeSwitchCallModel, InsertionModel } from '@rocket.chat/model-typings';
import type {
	AggregateOptions,
	Collection,
	CountDocumentsOptions,
	Db,
	FindCursor,
	FindOptions,
	IndexDescription,
	WithoutId,
} from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { readSecondaryPreferred } from '../readSecondaryPreferred';

export class FreeSwitchCallRaw extends BaseRaw<IFreeSwitchCall> implements IFreeSwitchCallModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IFreeSwitchCall>>) {
		super(db, 'freeswitch_calls', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { UUID: 1 } }, { key: { channels: 1 } }, { key: { direction: 1, startedAt: 1 } }];
	}

	public async registerCall(call: WithoutId<InsertionModel<IFreeSwitchCall>>): Promise<void> {
		await this.findOneAndUpdate({ UUID: call.UUID }, { $set: call }, { upsert: true });
	}

	public findAllByChannelUniqueIds<T extends IFreeSwitchCall>(uniqueIds: string[], options?: FindOptions<IFreeSwitchCall>): FindCursor<T> {
		return this.find<T>(
			{
				channels: { $in: uniqueIds },
			},
			options,
		);
	}

	public countCallsByDirection(direction: IFreeSwitchCall['direction'], minDate?: Date, options?: CountDocumentsOptions): Promise<number> {
		return this.countDocuments(
			{
				direction,
				...(minDate && { startedAt: { $gte: minDate } }),
			},
			{ readPreference: readSecondaryPreferred(), ...options },
		);
	}

	public async sumCallsDuration(minDate?: Date, options?: AggregateOptions): Promise<number> {
		return this.col
			.aggregate(
				[
					...(minDate ? [{ $match: { startedAt: { $gte: minDate } } }] : []),
					{
						$group: {
							_id: '1',
							calls: { $sum: '$duration' },
						},
					},
				],
				{ readPreference: readSecondaryPreferred(), ...options },
			)
			.toArray()
			.then(([{ calls }]) => calls);
	}

	public countCallsBySuccessState(success: boolean, minDate?: Date, options?: CountDocumentsOptions): Promise<number> {
		return this.countDocuments(
			{
				...(success ? { duration: { $gte: 5 } } : { $or: [{ duration: { $exists: false } }, { duration: { $lt: 5 } }] }),
				...(minDate && { startedAt: { $gte: minDate } }),
			},
			{ readPreference: readSecondaryPreferred(), ...options },
		);
	}
}
