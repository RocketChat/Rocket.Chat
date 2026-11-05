import type { IRocketChatRecord } from './IRocketChatRecord.js';

export interface ILivechatUnitMonitor extends IRocketChatRecord {
	monitorId: string;
	unitId: string;
	username: string;
}
