import type { IRocketChatRecord } from './IRocketChatRecord.js';

export interface IRole extends IRocketChatRecord {
	description: string;
	mandatory2fa?: boolean;
	name: string;
	protected: boolean;
	scope: 'Users' | 'Subscriptions';
}
