import type { IMediaCallChannel, RocketChatRecordDeleted, MediaCallSignedActor } from '@rocket.chat/core-typings';
import type { IMediaCallChannelsModel, InsertionModel } from '@rocket.chat/model-typings';
import type { IndexDescription, Collection, Db, UpdateFilter, UpdateOptions, UpdateResult, FindOptions, Document } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MediaCallChannelsRaw extends BaseRaw<IMediaCallChannel> implements IMediaCallChannelsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMediaCallChannel>>) {
		super(db, 'media_call_channels', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{
				key: { callId: 1, actorType: 1, actorId: 1, contractId: 1 },
				unique: true,
			},
		];
	}

	public findOneByCallIdAndSignedActor<T extends Document = IMediaCallChannel>(
		params: MediaCallSignedActor & { callId: string },
		options?: FindOptions<T>,
	): Promise<T | null> {
		const { callId, type: actorType, id: actorId, contractId } = params;
		return this.findOne(
			{
				callId,
				actorType,
				actorId,
				contractId,
			},
			options,
		);
	}

	public updateOneById(
		_id: string,
		update: UpdateFilter<IMediaCallChannel> | Partial<IMediaCallChannel>,
		options?: UpdateOptions,
	): Promise<UpdateResult> {
		return this.updateOne({ _id }, update, options);
	}

	public createOrUpdateChannel(channel: InsertionModel<IMediaCallChannel>): Promise<IMediaCallChannel | null> {
		return this.findOneAndUpdate(
			{
				callId: channel.callId,
				actorType: channel.actorType,
				actorId: channel.actorId,
				contractId: channel.contractId,
			},
			{
				$setOnInsert: {
					...channel,
				},
			},
			{
				upsert: true,
				returnDocument: 'after',
			},
		);
	}

	public async setState(_id: string, state: IMediaCallChannel['state']): Promise<UpdateResult> {
		return this.updateOneById(_id, { $set: { state } });
	}

	public async setActiveById(_id: string): Promise<UpdateResult> {
		return this.updateOne({ _id, activeAt: { $exists: false } }, { $set: { state: 'active', activeAt: new Date() } });
	}
}
