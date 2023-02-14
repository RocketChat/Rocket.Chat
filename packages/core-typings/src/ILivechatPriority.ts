import type { IRocketChatRecord } from './IRocketChatRecord';

export interface ILivechatPriority extends IRocketChatRecord {
	name: string;
	description: string;
	dueTimeInMinutes: number;
}
