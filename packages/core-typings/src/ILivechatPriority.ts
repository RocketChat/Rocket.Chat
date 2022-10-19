import type { IRocketChatRecord } from './IRocketChatRecord';

export interface ILivechatPriority extends IRocketChatRecord {
	name: string;
	defaultValue: string;
	icon: string;
	sortItem: number;

	// Whether the priority has been modified by the user or not
	dirty: boolean;
}
