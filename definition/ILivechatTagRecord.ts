import { IRocketChatRecord } from './IRocketChatRecord';


export interface ILivechatTagRecord extends IRocketChatRecord {
	_id: string;
	name: string;
	description: string;
	numDepartments: number;
	departments: Array<string>;
}
