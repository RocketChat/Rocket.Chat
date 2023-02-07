import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

export interface IAuditLog {
	_id: string;
	ts: Date;
	results: number;
	u: Pick<IUser, '_id' | 'username' | 'avatarETag'>;
	fields: {
		msg: IMessage['msg'];
		users: IUser['username'][];
		room?: Omit<IRoom, '_updatedAt' | 'lastMessage'>;
		startDate: Date;
		endDate: Date;
	};
}
