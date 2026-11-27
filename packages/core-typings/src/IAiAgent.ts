import type { IAiAgentRevision } from './IAiAgentRevision';
import type { IAiEngine } from './IAiEngine';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

/**
 * An agent made in the AI Center. It holds one seat of its engine for good, and its revisions are numbered from
 * `lastVersion`; the engine serves only the revision named by `headVersion`. The seat's bot and rooms are read from the
 * seat registry, never stored here.
 */
export interface IAiAgent extends IRocketChatRecord {
	engineId: IAiEngine['_id'];
	seatId: string;
	claim: string;
	lastVersion: number;
	headVersion?: IAiAgentRevision['version'];
	status?: IAiAgentRevision['status'];
	createdBy: IUser['_id'];
	createdAt: Date;
}
