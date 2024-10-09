import type { IRocketChatRecord } from '@rocket.chat/core-typings';

export interface ILivechatUnitMonitor extends IRocketChatRecord {
	monitorId: string;
	unitId: string;
	username: string;
}
