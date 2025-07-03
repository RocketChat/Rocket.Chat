import type { IFreeSwitchChannelEvent, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IFreeSwitchChannelEventModel, InsertionModel } from '@rocket.chat/model-typings';
import type { IndexDescription, Collection, Db, FindOptions, FindCursor, WithoutId, InsertOneResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class FreeSwitchChannelEventRaw extends BaseRaw<IFreeSwitchChannelEvent> implements IFreeSwitchChannelEventModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IFreeSwitchChannelEvent>>) {
		super(db, 'freeswitch_channel_events', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { channelUniqueId: 1, sequence: 1 }, unique: true },
			// Allow 3 days of events to be saved
			{ key: { receivedAt: 1 }, expireAfterSeconds: 3 * 24 * 60 * 60 },
		];
	}

	public async registerEvent(event: WithoutId<InsertionModel<IFreeSwitchChannelEvent>>): Promise<InsertOneResult<IFreeSwitchChannelEvent>> {
		return this.insertOne(event);
	}

	public findAllByChannelUniqueId<T extends IFreeSwitchChannelEvent>(
		channelUniqueId: string,
		options?: FindOptions<IFreeSwitchChannelEvent>,
	): FindCursor<T> {
		const theOptions: FindOptions<IFreeSwitchChannelEvent> = {
			sort: {
				sequence: 1,
			},
			...options,
		};

		return this.find<T>(
			{
				channelUniqueId,
			},
			theOptions,
		);
	}
}
