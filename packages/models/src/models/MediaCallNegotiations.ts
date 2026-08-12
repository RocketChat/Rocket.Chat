import type {
	RocketChatRecordDeleted,
	IMediaCallNegotiation,
	MediaCallNegotiationStream,
	RTCSessionDescriptionInit,
} from '@rocket.chat/core-typings';
import type { IMediaCallNegotiationsModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { IndexDescription, Collection, Db, Document, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MediaCallNegotiationsRaw extends BaseRaw<IMediaCallNegotiation> implements IMediaCallNegotiationsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMediaCallNegotiation>>) {
		super(db, 'media_call_negotiations', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { callId: 1, requestTimestamp: -1 }, unique: false }];
	}

	public async findLatestByCallId<
		T extends Document = IMediaCallNegotiation,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(callId: IMediaCallNegotiation['callId'], options?: O): Promise<DocumentWithProjection<T, O> | null> {
		return this.findOne<T, O>(
			{
				callId,
			},
			// safe to merge into `O`: only `O['projection']` feeds the return type, and it survives the spread.
			// note the model's `sort`/`limit` win over caller-supplied ones.
			{
				...options,
				sort: {
					requestTimestamp: -1,
				},
				limit: 1,
			} as unknown as O,
		);
	}

	public async setOfferById(
		id: string,
		offer: RTCSessionDescriptionInit,
		offerStreams?: MediaCallNegotiationStream[],
	): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: id,
				offer: { $exists: false },
			},
			{
				$set: {
					offer,
					offerTimestamp: new Date(),
					...(offerStreams && { offerStreams }),
				},
			},
		);
	}

	public async setAnswerById(
		id: string,
		answer: RTCSessionDescriptionInit,
		answerStreams?: MediaCallNegotiationStream[],
	): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: id,
				answer: { $exists: false },
			},
			{
				$set: {
					answer,
					answerTimestamp: new Date(),
					...(answerStreams && { answerStreams }),
				},
			},
		);
	}

	public async setStableById(id: string): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: id,
				stableTimestamp: { $exists: false },
			},
			{
				$set: {
					stableTimestamp: new Date(),
				},
			},
		);
	}
}
