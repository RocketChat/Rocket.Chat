import type { IMessage } from './IMessage/IMessage.js';
import type { IRocketChatRecord } from './IRocketChatRecord.js';
import type { IUser } from './IUser.js';

export interface MessageReads extends IRocketChatRecord {
	tmid: IMessage['_id'];
	ls: Date;
	userId: IUser['_id'];
}
