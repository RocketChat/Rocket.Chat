import type { IRocketChatRecord } from './IRocketChatRecord';
import type { $brand } from './utils';

export enum LivechatPriorityWeight {
	LOWEST = 5,
	LOW = 4,
	MEDIUM = 3,
	HIGH = 2,
	HIGHEST = 1,
	NOT_SPECIFIED = 99,
}

export interface ILivechatPriority extends IRocketChatRecord {
	_id: string & $brand<'livechat-priority-id'>;
	name?: string;
	i18n: string;
	sortItem: LivechatPriorityWeight;

	// Whether the priority has been modified by the user or not
	dirty: boolean;
}

export type ILivechatPriorityData = Omit<ILivechatPriority, '_id' | '_updatedAt'>;
