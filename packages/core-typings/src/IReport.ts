import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IMessage } from './IMessage/IMessage';
import type { IUser } from './IUser';

export interface IReport extends IRocketChatRecord {
	message: IMessage;
	description: string;
	ts: Date;
	userId: string;
	reportedBy?: Pick<IUser, '_id' | 'username' | 'avatarETag' | 'active' | 'name' | 'createdAt'>;
	_hidden?: boolean;
	_hiddenAt?: Date;
	_hiddenBy?: string;
}
