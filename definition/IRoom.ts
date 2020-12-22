import { IRocketChatRecord } from './IRocketChatRecord';
import { IMessage } from './IMessage';
import { IUser, Username } from './IUser';

type RoomType = 'c' | 'd' | 'p' | 'l';

export type RoomID = string;
export type ChannelName = string;

export interface IRoom extends IRocketChatRecord {
	_id: RoomID;
	t: RoomType;
	name: string;
	msgs: number;
	default?: true;
	broadcast?: true;
	featured?: true;
	encrypted?: boolean;

	u: Pick<IUser, '_id' | 'username' | 'name'>;

	lastMessage?: IMessage;
	lm?: Date;
	usersCount: number;
	jitsiTimeout: Date;

	streamingOptions?: {
		id?: string;
		type: string;
	};

	prid?: string;
	avatarETag?: string;
	tokenpass?: {
		require: string;
		tokens: {
			token: string;
			balance: number;
		}[];
	};
}

export interface IDirectMessageRoom extends Omit<IRoom, 'default' | 'featured' | 'u' | 'name'> {
	t: 'd';
	uids: Array<string>;
	usernames: Array<Username>;
}


export interface IOmnichannelRoom extends Omit<IRoom, 'default' | 'featured' | 'u' | 'name'> {
	t: 'l';
	v: {
		status: 'online' | 'busy' | 'away' | 'offline';
	};
}
