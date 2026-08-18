import type { IRocketChatRecord } from './IRocketChatRecord';

export interface ICronHistoryItem extends IRocketChatRecord {
	name: string;
	intendedAt: Date;
	startedAt: Date;
	finishedAt?: Date;
	result?: any;
	error?: any;
}
