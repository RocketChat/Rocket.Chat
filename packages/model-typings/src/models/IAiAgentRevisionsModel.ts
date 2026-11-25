import type { IAiAgentRevision } from '@rocket.chat/core-typings';
import type { Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

type RevisionWrites = 'update' | 'updateOne' | 'updateMany' | 'findOneAndUpdate' | 'getUpdater' | 'updateFromUpdater';

/** Revisions are immutable: the model offers no way to change one after it is inserted */
export interface IAiAgentRevisionsModel extends Omit<IBaseModel<IAiAgentRevision>, RevisionWrites> {
	findOneByAgentIdAndVersion<P extends Document = IAiAgentRevision, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		agentId: IAiAgentRevision['agentId'],
		version: IAiAgentRevision['version'],
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null>;
}
