import type { IFreeSwitchChannel, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IFreeSwitchChannelModel, InsertionModel } from '@rocket.chat/model-typings';
import type {
	AggregateOptions,
	Collection,
	CountDocumentsOptions,
	Db,
	FindCursor,
	FindOptions,
	IndexDescription,
	WithoutId,
	InsertOneResult,
} from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { readSecondaryPreferred } from '../readSecondaryPreferred';

export class FreeSwitchChannelRaw extends BaseRaw<IFreeSwitchChannel> implements IFreeSwitchChannelModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IFreeSwitchChannel>>) {
		super(db, 'freeswitch_channels', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { uniqueId: 1 }, unique: true },
			{ key: { kind: 1, startedAt: -1 } },
			{ key: { kind: 1, callDirection: 1, startedAt: -1 } },
			{ key: { kind: 1, anyBridge: 1, startedAt: -1 } },
		];
	}

	public async registerChannel(channel: WithoutId<InsertionModel<IFreeSwitchChannel>>): Promise<InsertOneResult<IFreeSwitchChannel>> {
		return this.insertOne(channel);
	}

	public findAllByUniqueIds<T extends IFreeSwitchChannel>(uniqueIds: string[], options?: FindOptions<IFreeSwitchChannel>): FindCursor<T> {
		return this.find<T>(
			{
				uniqueId: { $in: uniqueIds },
			},
			options,
		);
	}

	public countChannelsByKind(kind: Required<IFreeSwitchChannel>['kind'], minDate?: Date, options?: CountDocumentsOptions): Promise<number> {
		return this.countDocuments(
			{
				kind,
				...(minDate && { startedAt: { $gte: minDate } }),
			},
			{ readPreference: readSecondaryPreferred(), ...options },
		);
	}

	public countChannelsByKindAndDirection(
		kind: Required<IFreeSwitchChannel>['kind'],
		callDirection: Required<IFreeSwitchChannel>['callDirection'],
		minDate?: Date,
		options?: CountDocumentsOptions,
	): Promise<number> {
		return this.countDocuments(
			{
				kind,
				callDirection,
				...(minDate && { startedAt: { $gte: minDate } }),
			},
			{ readPreference: readSecondaryPreferred(), ...options },
		);
	}

	public async sumChannelsDurationByKind(
		kind: Required<IFreeSwitchChannel>['kind'],
		minDate?: Date,
		options?: AggregateOptions,
	): Promise<number> {
		return this.col
			.aggregate(
				[
					{
						$match: {
							kind,
							...(minDate && { startedAt: { $gte: minDate } }),
						},
					},
					{
						$group: {
							_id: '1',
							calls: { $sum: '$totalDuration' },
						},
					},
				],
				{ readPreference: readSecondaryPreferred(), ...options },
			)
			.toArray()
			.then(([{ calls }]) => calls);
	}

	public countChannelsByKindAndSuccessState(
		kind: Required<IFreeSwitchChannel>['kind'],
		success: boolean,
		minDate?: Date,
		options?: CountDocumentsOptions,
	): Promise<number> {
		return this.countDocuments(
			{
				kind,
				anyBridge: success,
				...(minDate && { startedAt: { $gte: minDate } }),
			},
			{ readPreference: readSecondaryPreferred(), ...options },
		);
	}
}
