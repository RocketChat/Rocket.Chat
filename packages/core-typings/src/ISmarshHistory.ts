import type { IRocketChatRecord } from './IRocketChatRecord.js';

export interface ISmarshHistory extends IRocketChatRecord {
	lastRan: Date;
	lastResult: string;
}
