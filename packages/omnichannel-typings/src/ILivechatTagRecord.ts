import type { IRocketChatRecord } from '@rocket.chat/core-typings';

export interface ILivechatTagRecord extends IRocketChatRecord {
	_id: string;
	name: string;
	description: string;
	numDepartments: number;
	departments: Array<string>;
}
