import { IRocketChatRecord } from './IRocketChatRecord';
import { IUser } from './IUser';
import { ChannelName, RoomID } from './IRoom';

export interface ITask extends IRocketChatRecord {
	rid: RoomID;
	ts: Date;
	channels?: Array<ChannelName>;
	u: Pick<IUser, '_id' | 'username' | 'name'>;
	mentions?: {
		_id: string;
		type: 'user';
		name?: string;
		username?: string;
	}[];
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

	title: string;
	taskAssignee?: Pick<IUser, '_id' | 'username' | 'name'>;
	taskDescription?: string;
	taskStatus?: string;
}
