import type { IRocketChatRecord } from '@rocket.chat/core-typings';

export interface ILivechatMonitorRecord extends IRocketChatRecord {
	_id: string;
	name: string;
	enabled: boolean;
	numMonitors: number;
	type: string;
	visibility: string;
}
