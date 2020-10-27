import { IRocketChatRecord } from './IRocketChatRecord';
import { IUser, Username } from './IUser';
import { ChannelName, RoomID } from './IRoom';

export interface IMessage extends IRocketChatRecord {
	rid: RoomID;
	msg: string;
	ts: Date;
	mentions?: Array<Username> | {
		_id: string;
		name?: string;
	}[];
	channels?: Array<ChannelName>;
	u: Pick<IUser, '_id' | 'username' | 'name'>;

	_hidden?: boolean;
	imported?: boolean;
}
