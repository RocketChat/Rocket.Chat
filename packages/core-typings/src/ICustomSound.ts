import type { IRocketChatRecord } from './IRocketChatRecord.js';

export interface ICustomSound extends IRocketChatRecord {
	name: string;
	extension: string;
	src?: string;
	random?: unknown;
}
