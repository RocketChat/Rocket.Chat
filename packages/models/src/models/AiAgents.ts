import type { IAiAgent } from '@rocket.chat/core-typings';
import type { DocumentWithProjection, FindOptionsWithProjection, IAiAgentsModel } from '@rocket.chat/model-typings';
import type { Db, DeleteResult, Document, FindCursor, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

const DATABASE_NOW_MS = { $toLong: '$$NOW' };

export class AiAgentsRaw extends BaseRaw<IAiAgent> implements IAiAgentsModel {
	constructor(db: Db) {
		super(db, 'ai_agents');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { seatId: 1 }, unique: true }, { key: { engineId: 1 } }];
	}

	findOneBySeatId<P extends Document = IAiAgent, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		seatId: IAiAgent['seatId'],
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null> {
		return this.findOne<P, O>({ seatId }, options);
	}

	findByEngineId<P extends Document = IAiAgent, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		engineId: IAiAgent['engineId'],
		options?: O,
	): FindCursor<DocumentWithProjection<P, O>> {
		return this.find<P, O>({ engineId }, { ...options, sort: { createdAt: -1 } } as unknown as O);
	}

	findAllSortedByCreatedAt<P extends Document = IAiAgent, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		options?: O,
	): FindCursor<DocumentWithProjection<P, O>> {
		return this.find<P, O>({}, { ...options, sort: { createdAt: -1 } } as unknown as O);
	}

	deleteOneUncommittedById(agentId: IAiAgent['_id']): Promise<DeleteResult> {
		return this.deleteOne({ _id: agentId, headVersion: { $exists: false } });
	}

	async allocateVersionById(agentId: IAiAgent['_id'], maxAheadMs: number): Promise<number | null> {
		const agent = await this.findOneAndUpdate(
			{ _id: agentId, $expr: { $lte: ['$lastVersion', { $add: [DATABASE_NOW_MS, maxAheadMs] }] } },
			[{ $set: { lastVersion: { $max: [{ $add: ['$lastVersion', 1] }, DATABASE_NOW_MS] } } }],
			{ returnDocument: 'after', projection: { lastVersion: 1 } },
		);

		return agent ? Number(agent.lastVersion) : null;
	}

	setHeadVersionById(
		agentId: IAiAgent['_id'],
		expectedHeadVersion: IAiAgent['headVersion'],
		{ version, status }: { version: number; status: NonNullable<IAiAgent['status']> },
	): Promise<UpdateResult> {
		return this.updateOne(
			{ _id: agentId, headVersion: expectedHeadVersion === undefined ? { $exists: false } : expectedHeadVersion },
			{ $set: { headVersion: version, status } },
		);
	}
}
