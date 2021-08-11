import { IRocketChatRecord } from './IRocketChatRecord';
import { IMessage } from './IMessage';
import { IUser, Username } from './IUser';

type RoomType = 'c' | 'd' | 'p' | 'l';

export type RoomID = string;
export type ChannelName = string;
interface IRequestTranscript {
	email: string;
	requestedAt: Date;
	requestedBy: IUser;
	subject: string;
}

export interface IRoom extends IRocketChatRecord {
	_id: RoomID;
	t: RoomType;
	name?: string;
	fname: string;
	msgs: number;
	default?: true;
	broadcast?: true;
	featured?: true;
	encrypted?: boolean;
	topic: any;

	u: Pick<IUser, '_id' | 'username' | 'name'>;
	uids: Array<string>;

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

	teamMain?: boolean;
	teamId?: string;
	teamDefault?: boolean;
	open?: boolean;

	autoTranslateLanguage: string;
	autoTranslate?: boolean;
	unread?: number;
	alert?: boolean;
	hideUnreadStatus?: boolean;

	sysMes?: string[];
	muted?: string[];
}

export interface IDirectMessageRoom extends Omit<IRoom, 'default' | 'featured' | 'u' | 'name'> {
	t: 'd';
	uids: Array<string>;
	usernames: Array<Username>;
}


export interface IOmnichannelRoom extends Omit<IRoom, 'default' | 'featured' | 'broadcast' | 'featured' | ''> {
	t: 'l';
	v: {
		_id?: string;
		token?: string;
		status: 'online' | 'busy' | 'away' | 'offline';
	};
	transcriptRequest?: IRequestTranscript;
	servedBy?: {
		_id: string;
	};
	onHold?: boolean;
	departmentId?: string;

	tags: any;
	closedAt: any;
	metrics: any;
	waitingResponse: any;
	responseBy: any;
	priorityId: any;
	livechatData: any;
}

export const isOmnichannelRoom = (room: IRoom): room is IOmnichannelRoom & IRoom => room.t === 'l';
