import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IRoom } from './IRoom';
import type { IUser } from './IUser';

export interface IScheduledMessage extends IRocketChatRecord {
	_id: string;
	t: 'scheduled_message';
	rid: IRoom['_id'];
	msg: string;
	u: Pick<IUser, '_id' | 'username' | 'name'>;
	ts: Date;
	scheduledAt: Date;
	tmid?: string;
	tshow?: boolean;
	_updatedAt: Date;
}
