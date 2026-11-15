import type { IRocketChatRecord } from './IRocketChatRecord';

export interface ICustomSound extends IRocketChatRecord {
	name: string;
	extension: string;
	src?: string;
	random?: unknown;
}
