import type { RocketChatRecordDeleted, IMediaCallNegotiation } from '@rocket.chat/core-typings';
import type { IMediaCallNegotiationsModel } from '@rocket.chat/model-typings';
import type { IndexDescription, Collection, Db, FindOptions, Document, FindCursor, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MediaCallNegotiationsRaw extends BaseRaw<IMediaCallNegotiation> implements IMediaCallNegotiationsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMediaCallNegotiation>>) {
		super(db, 'media_call_negotiations', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { callId: 1, requestTimestamp: -1, stableTimestamp: -1 }, unique: false, sparse: true }];
	}

	public async findAllByCallId<T extends Document = IMediaCallNegotiation>(
		callId: IMediaCallNegotiation['callId'],
		options?: FindOptions<T>,
	): Promise<FindCursor<T>> {
		return this.find({ callId }, options);
	}

	public async findLatestByCallId<T extends Document = IMediaCallNegotiation>(
		callId: IMediaCallNegotiation['callId'],
		options?: FindOptions<T>,
	): Promise<T | null> {
		return this.findOne(
			{
				callId,
			},
			{
				...options,
				sort: {
					requestTimestamp: -1,
				},
				limit: 1,
			},
		);
	}

	public async findActiveByCallId<T extends Document = IMediaCallNegotiation>(
		callId: IMediaCallNegotiation['callId'],
		options?: FindOptions<T>,
	): Promise<T | null> {
		return this.findOne(
			{
				callId,
				stableTimestamp: { $exists: true },
			},
			{
				...options,
				sort: {
					requestTimestamp: -1,
				},
				limit: 1,
			},
		);
	}

	public async setOfferById(id: string, offer: RTCSessionDescriptionInit): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: id,
				offer: { $exists: false },
			},
			{
				$set: {
					offer,
					offerTimestamp: new Date(),
				},
			},
		);
	}

	public async setAnswerById(id: string, answer: RTCSessionDescriptionInit): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: id,
				answer: { $exists: false },
			},
			{
				$set: {
					answer,
					answerTimestamp: new Date(),
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
