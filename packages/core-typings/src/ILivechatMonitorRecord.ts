import type { IRocketChatRecord } from './IRocketChatRecord';

export interface ILivechatMonitorRecord extends IRocketChatRecord {
	_id: string;
	name: string;
	enabled: boolean;
	numMonitors: number;
	type: string;
	visibility: string;
}
