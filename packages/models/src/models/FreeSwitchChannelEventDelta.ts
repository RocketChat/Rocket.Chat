import type { IFreeSwitchChannelEventDelta, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IFreeSwitchChannelEventDeltaModel, InsertionModel } from '@rocket.chat/model-typings';
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
			{ key: { _updatedAt: 1 }, expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { isFinalState: false } },
		];
	}

	public async registerDelta(
		delta: WithoutId<InsertionModel<IFreeSwitchChannelEventDelta>>,
	): Promise<InsertOneResult<IFreeSwitchChannelEventDelta>> {
		return this.insertOne(delta);
	}
}
