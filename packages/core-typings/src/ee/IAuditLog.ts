import type { IMessage } from '../IMessage';
import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { IRoom } from '../IRoom';
import type { IUser } from '../IUser';

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
		filters?: string;
	};
}
