import type { IMessage } from './IMessage/IMessage.js';
import type { IRocketChatRecord } from './IRocketChatRecord.js';
import type { IRoom } from './IRoom.js';
import type { IUser } from './IUser.js';

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
