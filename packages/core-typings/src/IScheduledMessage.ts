import type { IMessage } from './IMessage';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IRoom } from './IRoom';
import type { IUser } from './IUser';

export type ScheduledMessageStatus = 'pending' | 'sending' | 'failed';

export interface IScheduledMessage extends IRocketChatRecord {
	rid: IMessage['rid'];
	tmid?: IMessage['_id'];
	tshow?: boolean;
	u: Pick<IUser, '_id' | 'username' | 'name'>;
	roomName?: string;
	roomType?: IRoom['t'];
	msg: string;
	files?: { _id: string; name: string; type?: string; description?: string }[];
	scheduledAt: Date;
	status: ScheduledMessageStatus;
	claimedAt?: Date;
	error?: string;
}

export type ScheduledMessageEditableFields = Partial<Pick<IScheduledMessage, 'msg' | 'scheduledAt' | 'files'>>;
