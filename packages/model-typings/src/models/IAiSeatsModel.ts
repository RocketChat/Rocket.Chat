import type { IAiSeat } from '@rocket.chat/core-typings';
import type { Document, FindCursor, InsertOneResult, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export type AiSeatRegistration = Omit<IAiSeat, '_id' | '_updatedAt' | 'state' | 'agentId' | 'claimedAt' | 'retiredBy' | 'retiredAt'>;

type SeatWrites = 'update' | 'updateOne' | 'updateMany' | 'findOneAndUpdate' | 'getUpdater' | 'updateFromUpdater';

/** A seat's state changes only through `claimSeat` and `retireSeat`; nothing moves a seat out of `retired` */
export interface IAiSeatsModel extends Omit<IBaseModel<IAiSeat>, SeatWrites> {
	findOneBySeatId<P extends Document = IAiSeat, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		seatId: IAiSeat['seatId'],
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null>;
	findOneByEngineIdAndSeatId<P extends Document = IAiSeat, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		engineId: IAiSeat['engineId'],
		seatId: IAiSeat['seatId'],
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null>;
	findByEngineId<P extends Document = IAiSeat, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		engineId: IAiSeat['engineId'],
		options?: O,
	): FindCursor<DocumentWithProjection<P, O>>;
	findAllSortedBySeatId<P extends Document = IAiSeat, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		options?: O,
	): FindCursor<DocumentWithProjection<P, O>>;
	/** Refused by the database when the seat id, in any state, or the bot is already registered */
	registerSeat(seat: AiSeatRegistration): Promise<InsertOneResult<IAiSeat>>;
	/** Moves a `registered` seat to `claimed` by the agent; matches nothing in any other state */
	claimSeat(seatId: IAiSeat['seatId'], agentId: NonNullable<IAiSeat['agentId']>, claimedAt: Date): Promise<UpdateResult>;
	/** Moves a seat in any state but `retired` to `retired`; a second retirement matches nothing */
	retireSeat(seatId: IAiSeat['seatId'], retiredBy: NonNullable<IAiSeat['retiredBy']>, retiredAt: Date): Promise<UpdateResult>;
}
