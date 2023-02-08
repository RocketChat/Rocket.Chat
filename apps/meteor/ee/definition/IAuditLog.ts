import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

export interface IAuditLog {
	_id: string;
	ts: Date;
	results: number;
	u: Pick<IUser, '_id' | 'username' | 'name' | 'avatarETag'>;
	fields: {
		msg: IMessage['msg'];
		users: IUser['username'][];
		room?: IRoom['name'];
		startDate: Date;
		endDate: Date;
	};
}
