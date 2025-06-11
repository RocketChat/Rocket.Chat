import type { IFreeSwitchChannelEventDelta, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IFreeSwitchChannelEventDeltaModel, InsertionModel } from '@rocket.chat/model-typings';
import { convertFromDaysToSeconds } from '@rocket.chat/tools';
import type { IndexDescription, Collection, Db, WithoutId, InsertOneResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class FreeSwitchChannelEventDeltaRaw extends BaseRaw<IFreeSwitchChannelEventDelta> implements IFreeSwitchChannelEventDeltaModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IFreeSwitchChannelEventDelta>>) {
		super(db, 'freeswitch_channel_event_deltas', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { channelUniqueId: 1 } },

			// Keep event deltas for 30 days, final state forever
			{ key: { _updatedAt: 1 }, expireAfterSeconds: convertFromDaysToSeconds(30), partialFilterExpression: { isFinalState: false } },
		];
	}

	public async registerDelta(
		delta: WithoutId<InsertionModel<IFreeSwitchChannelEventDelta>>,
	): Promise<InsertOneResult<IFreeSwitchChannelEventDelta>> {
		return this.insertOne(delta);
	}
}
