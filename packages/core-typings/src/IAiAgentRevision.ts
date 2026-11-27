import type { Binary } from 'mongodb';

import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export type AiAgentRevisionStatus = 'draft' | 'published' | 'disabled';

export type AiAgentRevisionAction = 'create' | 'disable';

/** One version of an agent record. Written once and never changed: `bytes` is the exact UTF-8 record and `digest` its SHA-256 */
export interface IAiAgentRevision extends IRocketChatRecord {
	agentId: string;
	version: number;
	bytes: Binary;
	digest: string;
	status: AiAgentRevisionStatus;
	actor: IUser['_id'];
	action: AiAgentRevisionAction;
	ts: Date;
}
