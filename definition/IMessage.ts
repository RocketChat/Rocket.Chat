import { IRocketChatRecord } from './IRocketChatRecord';
import { IUser } from './IUser';
import { ChannelName, RoomID } from './IRoom';

export interface IMessage extends IRocketChatRecord {
	rid: RoomID;
	msg: string;
	ts: Date;
	mentions?: {
		_id: string;
		name?: string;
	}[];
	channels?: Array<ChannelName>;
	u: Pick<IUser, '_id' | 'username' | 'name'>;

	_hidden?: boolean;
	imported?: boolean;
	replies?: IUser['_id'][];
	location?: {
		type: 'Point';
		coordinates: [string, string];
	};
}
