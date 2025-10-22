import type { IMessage } from './IMessage/IMessage';
import type { IRoom } from './IRoom';
import type { IUser } from './IUser';

export type ReadReceipt = {
	token?: string;
	messageId: IMessage['_id'];
	roomId: IRoom['_id'];
	ts: Date;
	t?: IMessage['t'];
	pinned?: IMessage['pinned'];
	drid?: IMessage['drid'];
	tmid?: IMessage['tmid'];
	userId: IUser['_id'];
	_id: string;
};
