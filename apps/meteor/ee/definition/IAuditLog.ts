import type { ILivechatAgent, ILivechatVisitor, IRocketChatRecord, IRoom, IUser } from '@rocket.chat/core-typings';

export interface IAuditLog extends IRocketChatRecord {
	ts: Date;
	results: number;
	u: Pick<IUser, '_id' | 'username' | 'name' | 'avatarETag'>;
	fields:
		| {
				type: '';
				msg: string;
				startDate: Date;
				endDate: Date;
				rids: [rid: IRoom['_id']];
				room: IRoom['name'];
				users?: never;
				visitor?: never;
				agent?: never;
		  }
		| {
				type: 'u';
				msg: string;
				startDate: Date;
				endDate: Date;
				rids?: never;
				room?: never;
				users: Exclude<IUser['username'], undefined>[];
				visitor?: never;
				agent?: never;
		  }
		| {
				type: 'd';
				msg: string;
				startDate: Date;
				endDate: Date;
				rids?: never;
				room?: never;
				users: Exclude<IUser['username'], undefined>[];
				visitor?: never;
				agent?: never;
		  }
		| {
				type: 'l';
				msg: string;
				startDate: Date;
				endDate: Date;
				rids?: never;
				room?: never;
				users?: never;
				visitor?: ILivechatVisitor['_id'];
				agent?: ILivechatAgent['_id'];
		  };
}
