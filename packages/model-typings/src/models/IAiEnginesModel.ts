import type { IAiEngine, IAiEngineCredential, IAiEngineObservedReport } from '@rocket.chat/core-typings';
import type { Document, FindCursor, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IAiEnginesModel extends IBaseModel<IAiEngine> {
	findAllSortedByName<P extends Document = IAiEngine, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		options?: O,
	): FindCursor<DocumentWithProjection<P, O>>;
	findOneByCredentialId<P extends Document = IAiEngine, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		credentialId: IAiEngineCredential['id'],
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null>;
	/** Adds the credential only while the engine has fewer than `maxActive` credentials that are neither revoked nor expired at `now` */
	addCredentialWhileFewerActive(
		engineId: IAiEngine['_id'],
		credential: IAiEngineCredential,
		limit: { maxActive: number; now: Date },
	): Promise<UpdateResult>;
	revokeCredentialById(engineId: IAiEngine['_id'], credentialId: IAiEngineCredential['id'], revokedAt: Date): Promise<UpdateResult>;
	updateObservedReport(engineId: IAiEngine['_id'], observed: IAiEngineObservedReport, receivedAt: Date): Promise<UpdateResult>;
}
