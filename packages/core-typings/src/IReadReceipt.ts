import type { IMessage } from './IMessage/IMessage';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IRoom } from './IRoom';
import type { IUser } from './IUser';

export interface IReadReceipt extends IRocketChatRecord {
	token?: string;
	messageId: IMessage['_id'];
	roomId: IRoom['_id'];
	ts: Date;
	t?: IMessage['t'];
	pinned?: IMessage['pinned'];
	drid?: IMessage['drid'];
	tmid?: IMessage['tmid'];
	userId: IUser['_id'];
}

export interface IReadReceiptWithUser extends IReadReceipt {
	user?: Pick<IUser, '_id' | 'name' | 'username'> | undefined;
}
