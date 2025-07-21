import type {
	IMediaCallChannel,
	RocketChatRecordDeleted,
	MediaCallParticipantIdentification,
	MediaCallChannelWebRTCSession,
} from '@rocket.chat/core-typings';
import type { IMediaCallChannelsModel } from '@rocket.chat/model-typings';
import type { IndexDescription, Collection, Db, UpdateFilter, UpdateOptions, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MediaCallChannelsRaw extends BaseRaw<IMediaCallChannel> implements IMediaCallChannelsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMediaCallChannel>>) {
		super(db, 'media_call_channels', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{
				key: { 'callId': 1, 'participant.type': 1, 'participant.id': 1, 'participant.sessionId': 1 },
				unique: true,
				sparse: true,
			},
		];
	}

	public async findOneByCallIdAndParticipant(
		callId: string,
		participant: MediaCallParticipantIdentification,
	): Promise<IMediaCallChannel | null> {
		return this.findOne({
			callId,
			'participant.type': participant.type,
			'participant.id': participant.id,
			...(participant.type === 'user' && { 'participant.sessionId': participant.sessionId }),
		});
	}

	public updateOneById(
		_id: string,
		update: UpdateFilter<IMediaCallChannel> | Partial<IMediaCallChannel>,
		options?: UpdateOptions,
	): Promise<UpdateResult> {
		return this.updateOne({ _id }, update, options);
	}

	public async setState(_id: string, state: IMediaCallChannel['state']): Promise<UpdateResult> {
		return this.updateOneById(_id, { $set: { state } });
	}

	public async setLocalWebRTCSession(_id: string, session: MediaCallChannelWebRTCSession): Promise<UpdateResult> {
		return this.updateOneById(_id, { $set: { 'webrtc.local': session } });
	}

	public async setRemoteWebRTCSession(_id: string, session: MediaCallChannelWebRTCSession): Promise<UpdateResult> {
		return this.updateOneById(_id, { $set: { 'webrtc.remote': session } });
	}
}
