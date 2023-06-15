import type { ILivechatVisitor } from './ILivechatVisitor';
import type { IMessage } from './IMessage/IMessage';
import type { IRoom } from './IRoom';
import type { IUser } from './IUser';

export type ReadReceipt = {
	messageId: IMessage['_id'];
	roomId: IRoom['_id'];
	ts: Date;
	user: Pick<IUser, '_id' | 'name' | 'username'> | ILivechatVisitor | null;
	userId: IUser['_id'];
	_id: string;
};
