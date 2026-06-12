import type { IMessage } from './IMessage/IMessage';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IRoom } from './IRoom';
import type { IUser } from './IUser';

export interface IReadReceipt extends IRocketChatRecord {
	token?: string;
	messageId: IMessage['_id'];
	roomId: IRoom['_id'];
	userId: IUser['_id'];
	ts: Date;
}

export interface IReadReceiptWithUser extends IReadReceipt {
	user?: Pick<IUser, '_id' | 'name' | 'username'> | undefined;
}
