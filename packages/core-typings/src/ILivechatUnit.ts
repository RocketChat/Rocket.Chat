import type { ILivechatDepartmentRecord, IRocketChatRecord } from '.';

export interface ILivechatUnit extends IRocketChatRecord, ILivechatDepartmentRecord {
	name: string;
	visibility: string;
	type: 'u';
	numMonitors: number;
	numDepartments: number;
}
