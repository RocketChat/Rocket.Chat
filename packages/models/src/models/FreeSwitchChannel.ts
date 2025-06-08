import type { IFreeSwitchChannel, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IFreeSwitchChannelModel, InsertionModel } from '@rocket.chat/model-typings';
import type { IndexDescription, Collection, Db, FindOptions, FindCursor, WithoutId, InsertOneResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class FreeSwitchChannelRaw extends BaseRaw<IFreeSwitchChannel> implements IFreeSwitchChannelModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IFreeSwitchChannel>>) {
		super(db, 'freeswitch_channels', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { uniqueId: 1 }, unique: true },
			// Allow 15 days of events to be saved
			{ key: { _updatedAt: 1 }, expireAfterSeconds: 30 * 24 * 60 * 15 },
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
}
