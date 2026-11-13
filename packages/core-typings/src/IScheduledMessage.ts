import type { IMessage } from './IMessage';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export interface IScheduledMessage extends IRocketChatRecord {
	rid: IMessage['rid'];
	tmid?: IMessage['_id'];
	tshow?: boolean;
	u: Pick<IUser, '_id'>;
	msg: string;
	t?: 'e2e';
	content?: IMessage['content'];
	e2eMentions?: IMessage['e2eMentions'];
	files?: { _id: string; name: string; type?: string; description?: string }[];
	scheduledAt: Date;
	status: 'pending' | 'sending' | 'failed';
	claimedAt?: Date;
	error?: string;
}

export type ScheduledMessageEditableFields = Partial<Pick<IScheduledMessage, 'msg' | 'scheduledAt' | 'files' | 'content' | 'e2eMentions'>>;
