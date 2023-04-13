import type { IMessage } from './IMessage/IMessage';
import type { IUser } from './IUser';

export type MessageReads = {
	_id: string;
	tmid: IMessage['_id'];
	ls: Date;
	userId: IUser['_id'];
};
