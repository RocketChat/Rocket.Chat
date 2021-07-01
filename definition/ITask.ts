import { IRocketChatRecord } from './IRocketChatRecord';
import { IUser } from './IUser';
import { ChannelName, RoomID } from './IRoom';

type MentionType = 'user' | 'team';

export interface IMessage extends IRocketChatRecord {
	rid: RoomID;
	msg: string;
	ts: Date;
	channels?: Array<ChannelName>;
	u: Pick<IUser, '_id' | 'username' | 'name'>;

	_hidden?: boolean;
	imported?: boolean;
	replies?: IUser['_id'][];
	location?: {
		type: 'Point';
		coordinates: [string, string];
	};
	starred?: {_id: string}[];
	pinned?: boolean;
	tlm?: Date;

	dcount?: number;
	tcount?: number;
	t?: string;
	e2e?: 'pending';

	taskAssignee?: Pick<IUser, '_id' | 'username' | 'name'>;
	taskDescription?: string;
	taskStatus: {_id: string}[];
}
