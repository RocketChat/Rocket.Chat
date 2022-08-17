import type { IRocketChatRecord } from './IRocketChatRecord';

export interface ICustomSound extends IRocketChatRecord {
	name: string;
	statusType: string;
}
