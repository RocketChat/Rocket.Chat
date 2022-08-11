import type { ILivechatDepartmentRecord, IRocketChatRecord } from '.';

export interface IOmnichannelBusinessUnit extends IRocketChatRecord, ILivechatDepartmentRecord {
	name: string;
	visibility: 'public' | 'private';
	type: string;
	numMonitors: number;
	numDepartments: number;
}
