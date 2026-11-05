import type { IRocketChatRecord } from './IRocketChatRecord.js';

export interface ILivechatTagRecord extends IRocketChatRecord {
	name: string;
	description: string;
	numDepartments: number;
	departments: Array<string>;
}
