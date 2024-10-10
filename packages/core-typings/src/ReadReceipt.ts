import type { IMessage } from './IMessage/IMessage';
import type { IRoom } from './IRoom';
import type { IUser } from './IUser';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ReadReceipt {
	messageId: IMessage['_id'];
	roomId: IRoom['_id'];
	ts: Date;
	user: Pick<IUser, '_id' | 'name' | 'username'> | null;
	userId: IUser['_id'];
	_id: string;
}
