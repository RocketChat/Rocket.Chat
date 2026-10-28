import type { IRocketChatRecord } from './IRocketChatRecord';

export interface ISmarshHistory extends IRocketChatRecord {
	lastRan: Date;
	lastResult: string;
}
