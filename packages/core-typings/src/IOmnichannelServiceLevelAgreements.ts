import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IOmnichannelServiceLevelAgreements extends IRocketChatRecord {
	name: string;
	description: string;
	dueTimeInMinutes: number;
}
