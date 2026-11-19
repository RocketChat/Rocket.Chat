import type { ILivechatAgent } from '../ILivechatAgent.js';
import type { ILivechatVisitor } from '../ILivechatVisitor.js';
import type { IMessage } from '../IMessage/index.js';
import type { IRocketChatRecord } from '../IRocketChatRecord.js';
import type { IRoom } from '../IRoom.js';
import type { IUser } from '../IUser.js';

export interface IAuditLog extends IRocketChatRecord {
	ts: Date;
	results: number;
	u: Pick<IUser, '_id' | 'username' | 'name' | 'avatarETag'>;
	fields: {
		type: string;
		msg: IMessage['msg'];
		startDate?: Date;
		endDate?: Date;
		rids?: IRoom['_id'][];
		room: IRoom['name'];
		users?: IUser['username'][];
		visitor?: ILivechatVisitor['_id'];
		agent?: ILivechatAgent['_id'];
		filters?: string;
	};
}
