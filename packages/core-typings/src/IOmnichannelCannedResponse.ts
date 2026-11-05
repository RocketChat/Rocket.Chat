import type { ILivechatDepartment } from './ILivechatDepartment.js';
import type { IRocketChatRecord } from './IRocketChatRecord.js';
import type { IUser } from './IUser.js';

export interface IOmnichannelCannedResponse extends IRocketChatRecord {
	shortcut: string;
	text: string;
	scope: string;
	tags: string[];
	// userId is optional, its only required when scope === 'user'
	userId?: IUser['_id'];
	departmentId?: ILivechatDepartment['_id'];
	createdBy: {
		_id: IUser['_id'];
		username: string;
	};
	_createdAt: Date;
}
