import type { IAiEngine, IAiEngineCredential, IAiEngineObservedReport } from '@rocket.chat/core-typings';
import type { DocumentWithProjection, FindOptionsWithProjection, IAiEnginesModel } from '@rocket.chat/model-typings';
import type { Db, Document, FindCursor, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AiEnginesRaw extends BaseRaw<IAiEngine> implements IAiEnginesModel {
	constructor(db: Db) {
		super(db, 'ai_engines');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { 'credentials.id': 1 }, unique: true, partialFilterExpression: { 'credentials.id': { $exists: true } } }];
	}

	findAllSortedByName<P extends Document = IAiEngine, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		options?: O,
	): FindCursor<DocumentWithProjection<P, O>> {
		// safe to merge into `O`: only `O['projection']` feeds the return type, and it survives the spread
		return this.find<P, O>({}, { ...options, sort: { name: 1 } } as unknown as O);
	}

	findOneByCredentialId<P extends Document = IAiEngine, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		credentialId: IAiEngineCredential['id'],
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null> {
		return this.findOne<P, O>({ 'credentials.id': credentialId }, options);
	}

	addCredentialWhileFewerActive(
		engineId: IAiEngine['_id'],
		credential: IAiEngineCredential,
		{ maxActive, now }: { maxActive: number; now: Date },
	): Promise<UpdateResult> {
		const activeCount = {
			$size: {
				$filter: {
					input: { $ifNull: ['$credentials', []] },
					cond: { $and: [{ $not: ['$$this.revokedAt'] }, { $gt: ['$$this.expiresAt', now] }] },
				},
			},
		};

		return this.updateOne({ _id: engineId, $expr: { $lt: [activeCount, maxActive] } }, { $push: { credentials: credential } });
	}

	revokeCredentialById(engineId: IAiEngine['_id'], credentialId: IAiEngineCredential['id'], revokedAt: Date): Promise<UpdateResult> {
		return this.updateOne(
			{ _id: engineId, credentials: { $elemMatch: { id: credentialId, revokedAt: { $exists: false } } } },
			{ $set: { 'credentials.$.revokedAt': revokedAt } },
		);
	}

	updateObservedReport(engineId: IAiEngine['_id'], observed: IAiEngineObservedReport, receivedAt: Date): Promise<UpdateResult> {
		return this.updateOne({ _id: engineId }, { $set: { observed, lastReportAt: receivedAt } });
	}
}
