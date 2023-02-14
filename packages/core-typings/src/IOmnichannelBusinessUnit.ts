import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IOmnichannelBusinessUnit extends IRocketChatRecord {
	_id: string;
	name: string;
	visibility: 'public' | 'private';
	type: string;
	numMonitors: number;
	numDepartments: number;
}
