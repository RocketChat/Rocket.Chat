import type { IAiAgent } from '@rocket.chat/core-typings';
import type { DeleteResult, Document, FindCursor, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IAiAgentsModel extends IBaseModel<IAiAgent> {
	findOneBySeatId<P extends Document = IAiAgent, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		seatId: IAiAgent['seatId'],
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null>;
	findByEngineId<P extends Document = IAiAgent, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		engineId: IAiAgent['engineId'],
		options?: O,
	): FindCursor<DocumentWithProjection<P, O>>;
	findAllSortedByCreatedAt<P extends Document = IAiAgent, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		options?: O,
	): FindCursor<DocumentWithProjection<P, O>>;
	/** Removes an uncommitted agent document (no head yet) after losing a seat-claim compare-and-set */
	deleteOneUncommittedById(agentId: IAiAgent['_id']): Promise<DeleteResult>;
	/**
	 * Takes the agent's next version number, the larger of its last one plus one and the database's clock in milliseconds,
	 * in one atomic write, so concurrent writers never get the same number. Returns null when the agent is missing or its
	 * last version is more than `maxAheadMs` ahead of the database's clock.
	 */
	allocateVersionById(agentId: IAiAgent['_id'], maxAheadMs: number): Promise<number | null>;
	/** Moves the head only if it is still `expectedHeadVersion` (`undefined` for an agent with no head yet) */
	setHeadVersionById(
		agentId: IAiAgent['_id'],
		expectedHeadVersion: IAiAgent['headVersion'],
		head: { version: number; status: NonNullable<IAiAgent['status']> },
	): Promise<UpdateResult>;
}
