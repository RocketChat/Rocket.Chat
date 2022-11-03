import type { IRocketChatRecord } from './IRocketChatRecord';

export interface ILivechatPriority extends IRocketChatRecord {
	name: string;
	level: string;
}

export type ILivechatPriorityData = Omit<ILivechatPriority, '_id' | '_updatedAt'>;
