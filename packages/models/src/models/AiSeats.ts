import type { IAiSeat } from '@rocket.chat/core-typings';
import type { AiSeatRegistration, DocumentWithProjection, FindOptionsWithProjection, IAiSeatsModel } from '@rocket.chat/model-typings';
import type { Db, Document, FindCursor, IndexDescription, InsertOneResult, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AiSeatsRaw extends BaseRaw<IAiSeat> implements IAiSeatsModel {
	constructor(db: Db) {
		super(db, 'ai_seats');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { seatId: 1 }, unique: true }, { key: { botUserId: 1 }, unique: true }, { key: { engineId: 1, state: 1 } }];
	}

	findOneBySeatId<P extends Document = IAiSeat, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		seatId: IAiSeat['seatId'],
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null> {
		return this.findOne<P, O>({ seatId }, options);
	}

	findOneByEngineIdAndSeatId<P extends Document = IAiSeat, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		engineId: IAiSeat['engineId'],
		seatId: IAiSeat['seatId'],
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null> {
		return this.findOne<P, O>({ engineId, seatId }, options);
	}

	findByEngineId<P extends Document = IAiSeat, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		engineId: IAiSeat['engineId'],
		options?: O,
	): FindCursor<DocumentWithProjection<P, O>> {
		return this.find<P, O>({ engineId }, { ...options, sort: { seatId: 1 } } as unknown as O);
	}

	findAllSortedBySeatId<P extends Document = IAiSeat, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		options?: O,
	): FindCursor<DocumentWithProjection<P, O>> {
		return this.find<P, O>({}, { ...options, sort: { seatId: 1 } } as unknown as O);
	}

	registerSeat(seat: AiSeatRegistration): Promise<InsertOneResult<IAiSeat>> {
		return this.insertOne({ ...seat, state: 'registered' });
	}

	claimSeat(seatId: IAiSeat['seatId'], agentId: NonNullable<IAiSeat['agentId']>, claimedAt: Date): Promise<UpdateResult> {
		return this.updateOne({ seatId, state: 'registered' }, { $set: { state: 'claimed', agentId, claimedAt } });
	}

	retireSeat(seatId: IAiSeat['seatId'], retiredBy: NonNullable<IAiSeat['retiredBy']>, retiredAt: Date): Promise<UpdateResult> {
		return this.updateOne({ seatId, state: { $ne: 'retired' } }, { $set: { state: 'retired', retiredBy, retiredAt } });
	}
}
