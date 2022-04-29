import type { IRocketChatRecord } from './IRocketChatRecord';

export interface ICustomUserStatus extends IRocketChatRecord {
	name: string;
	statusType: string;
}
