import type { IMediaCallChannel, RocketChatRecordDeleted, MediaCallActor } from '@rocket.chat/core-typings';
import type { IMediaCallChannelsModel, InsertionModel } from '@rocket.chat/model-typings';
import type { IndexDescription, Collection, Db, UpdateFilter, UpdateOptions, UpdateResult } from 'mongodb';

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

	public async findOneByCallIdAndActor(callId: string, actor: Required<MediaCallActor>): Promise<IMediaCallChannel | null> {
		return this.findOne({
			callId,
			actorType: actor.type,
			actorId: actor.id,
			contractId: actor.contractId,
		});
	}

	public updateOneById(
		_id: string,
		update: UpdateFilter<IMediaCallChannel> | Partial<IMediaCallChannel>,
		options?: UpdateOptions,
	): Promise<UpdateResult> {
		return this.updateOne({ _id }, update, options);
	}

	public createOrUpdateChannel(channel: InsertionModel<IMediaCallChannel>): Promise<IMediaCallChannel | null> {
		const { acknowledged, localDescription, ...channelData } = channel;

		const dataToUpdate = {
			// once acknowledged, a channel never unsets this flag
			...(acknowledged && { acknowledged: true }),
			...(localDescription && { localDescription }),
		} as const;

		return this.findOneAndUpdate(
			{
				callId: channel.callId,
				actorType: channel.actorType,
				actorId: channel.actorId,
				contractId: channel.contractId,
			},
			{
				$setOnInsert: {
					...channelData,
				},
				...(Object.keys(dataToUpdate).length > 0 && { $set: dataToUpdate }),
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

	public async setLocalDescription(_id: string, localDescription: RTCSessionDescriptionInit): Promise<UpdateResult> {
		return this.updateOneById(_id, { $set: { localDescription } });
	}
}
