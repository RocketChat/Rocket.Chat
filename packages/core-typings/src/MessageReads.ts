import type { IMessage } from './IMessage/IMessage';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface MessageReads extends IRocketChatRecord {
	tmid: IMessage['_id'];
	ls: Date;
	userId: IUser['_id'];
}
