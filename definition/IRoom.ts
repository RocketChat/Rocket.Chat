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
	featured?: true;

	u: Pick<IUser, '_id' | 'username' | 'name'>;

	lastMessage?: IMessage;
	lm?: Date;
	usersCount: number;
	// "jitsiTimeout" : Date

	prid: string;
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
	usernames: Array<Username>;
}
