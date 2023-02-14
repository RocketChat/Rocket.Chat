import type { ILivechatDepartment } from './ILivechatDepartment';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export interface IOmnichannelCannedResponse extends IRocketChatRecord {
	shortcut: string;
	text: string;
	scope: string;
	tags: any;
	userId: IUser['_id'];
	departmentId?: ILivechatDepartment['_id'];
	createdBy: {
		_id: IUser['_id'];
		username: string;
	};
	_createdAt: Date;
}
