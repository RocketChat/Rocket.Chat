import { IRocketChatRecord } from './IRocketChatRecord';

export interface ILivechatPriority extends IRocketChatRecord {
	name: string;
	description: string;
	dueTimeInMinutes: string;
}
