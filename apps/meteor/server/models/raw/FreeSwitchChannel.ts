import type { IFreeSwitchChannel, IFreeSwitchChannelEvent, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IFreeSwitchChannelModel } from '@rocket.chat/model-typings';
import type { IndexDescription, Collection, Db, FindOptions, FindCursor } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class FreeSwitchChannelRaw extends BaseRaw<IFreeSwitchChannel> implements IFreeSwitchChannelModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IFreeSwitchChannel>>) {
		super(db, 'freeswitch_channels', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { uniqueId: 1 }, unique: true }];
	}

	public async registerEvent(uniqueId: string, event: IFreeSwitchChannelEvent, channelData?: Partial<IFreeSwitchChannel>): Promise<void> {
		const { referencedIds = [], ...dataToSet } = channelData || {};

		await this.findOneAndUpdate(
			{
				uniqueId,
			},
			{
				$addToSet: {
					events: event,
					...(referencedIds.length && { referencedIds: { $each: referencedIds } }),
				},
				$set: {
					uniqueId,
					...dataToSet,
				},
			},
			{
				upsert: true,
			},
		);
	}

	public async linkUniqueIds(uniqueIds: string[]): Promise<void> {
		await this.updateMany({ uniqueId: { $in: uniqueIds } }, { $addToSet: { referencedIds: { $each: uniqueIds } } });
	}

	public async findOneByUniqueId<T extends IFreeSwitchChannel>(
		uniqueId: string,
		options?: FindOptions<IFreeSwitchChannel>,
	): Promise<T | null> {
		return this.findOne<T>({ uniqueId }, options);
	}

	public findAllByUniqueIds<T extends IFreeSwitchChannel>(uniqueIds: string[], options?: FindOptions<IFreeSwitchChannel>): FindCursor<T> {
		return this.find<T>(
			{
				uniqueId: { $in: uniqueIds },
			},
			options,
		);
	}

	public async setCallIdByIds(ids: string[], callId: string): Promise<void> {
		await this.updateMany({ _id: { $in: ids } }, { $set: { callId } });
	}
}
