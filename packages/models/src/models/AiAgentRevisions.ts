import type { IAiAgentRevision } from '@rocket.chat/core-typings';
import type { DocumentWithProjection, FindOptionsWithProjection, IAiAgentRevisionsModel } from '@rocket.chat/model-typings';
import type { Db, Document, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AiAgentRevisionsRaw extends BaseRaw<IAiAgentRevision> implements IAiAgentRevisionsModel {
	constructor(db: Db) {
		super(db, 'ai_agent_revisions');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { agentId: 1, version: 1 }, unique: true }];
	}

	findOneByAgentIdAndVersion<P extends Document = IAiAgentRevision, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		agentId: IAiAgentRevision['agentId'],
		version: IAiAgentRevision['version'],
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null> {
		return this.findOne<P, O>({ agentId, version }, options);
	}
}
