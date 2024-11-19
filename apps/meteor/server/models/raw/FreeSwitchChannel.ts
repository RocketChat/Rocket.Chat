import type { IFreeSwitchChannel, IFreeSwitchChannelEvent, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IFreeSwitchChannelModel } from '@rocket.chat/model-typings';
import type { IndexDescription, Collection, Db, FindOptions, FindCursor } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class FreeSwitchChannelRaw extends BaseRaw<IFreeSwitchChannel> implements IFreeSwitchChannelModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IFreeSwitchChannel>>) {
		super(db, 'freeswitch_channels', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { uniqueId: 1, otherLegUniqueId: 1, callId: 1 }, unique: true },
		];
	}

	public async registerEvent(
		channelUniqueId: string,
		event: IFreeSwitchChannelEvent,
		channelData?: Partial<IFreeSwitchChannel>,
	): Promise<void> {
		await this.findOneAndUpdate(
			{
				uniqueId: channelUniqueId,
			},
			{
				$addToSet: {
					events: event,
				},
				$set: {
					uniqueId: channelUniqueId,
					...channelData,
				},
			},
			{
				upsert: true,
			},
		);
	}

	public async getCallIdByUniqueIds(uniqueIds: string[]): Promise<string | undefined> {
		const channel = await this.findOne(
			{
				$or: [{ uniqueId: { $in: uniqueIds } }, { otherLegUniqueId: { $in: uniqueIds } }],
				callId: { $exists: true },
			},
			{ projection: { callId: 1 } },
		);
		return channel?.callId;
	}

	public findAllByUniqueIds(uniqueIds: string[], options?: FindOptions<IFreeSwitchChannel>): FindCursor<IFreeSwitchChannel> {
		return this.find(
			{
				$or: [{ uniqueId: { $in: uniqueIds } }, { otherLegUniqueId: { $in: uniqueIds } }],
			},
			options,
		);
	}

	public async setCallIdByUniqueIds(uniqueIds: string[], callId: string): Promise<void> {
		await this.updateMany({ $or: [{ uniqueId: { $in: uniqueIds } }, { otherLegUniqueId: { $in: uniqueIds } }] }, { $set: { callId } });
	}
}
