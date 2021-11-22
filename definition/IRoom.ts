import { IRocketChatRecord } from './IRocketChatRecord';
import { IMessage } from './IMessage';
import { IUser, Username } from './IUser';

type RoomType = 'c' | 'd' | 'p' | 'l';
type CallStatus = 'ringing' | 'ended' | 'declined' | 'ongoing';

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
	callStatus?: CallStatus;
	webRtcCallStartTime?: Date;
	servedBy?: {
		_id: string;
	};

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

	usernames?: string[];
	ts?: Date;
}

export interface ICreatedRoom extends IRoom {
	rid: string;
}

export interface IDirectMessageRoom extends Omit<IRoom, 'default' | 'featured' | 'u' | 'name'> {
	t: 'd';
	uids: Array<string>;
	usernames: Array<Username>;
}

export const isDirectMessageRoom = (room: Partial<IRoom>): room is IDirectMessageRoom => room.t === 'd';

export enum OmnichannelSourceType {
	WIDGET = 'widget',
	EMAIL = 'email',
	SMS = 'sms',
	APP = 'app',
	API = 'api',
	OTHER = 'other', // catch-all source type
}

export interface IOmnichannelRoom extends Omit<IRoom, 'default' | 'featured' | 'broadcast' | 'featured' | ''> {
	t: 'l';
	v: {
		_id?: string;
		token?: string;
		status: 'online' | 'busy' | 'away' | 'offline';
	};
	email?: {
		// Data used when the room is created from an email, via email Integration.
		inbox: string;
		thread: string;
		replyTo: string;
		subject: string;
	};
	source: {
		// The source, or client, which created the Omnichannel room
		type: OmnichannelSourceType;
		// An optional identification of external sources, such as an App
		id?: string;
		// A human readable alias that goes with the ID, for post analytical purposes
		alias?: string;
	};
	transcriptRequest?: IRequestTranscript;
	servedBy?: {
		_id: string;
		ts: Date;
		username: IUser['username'];
	};
	onHold?: boolean;
	departmentId?: string;

	lastMessage?: IMessage & { token?: string };

	tags: any;
	closedAt: any;
	metrics: any;
	waitingResponse: any;
	responseBy: any;
	priorityId: any;
	livechatData: any;
	queuedAt?: Date;

	ts: Date;
	label?: string;
	crmData?: unknown;
}

export const isOmnichannelRoom = (room: IRoom): room is IOmnichannelRoom & IRoom => room.t === 'l';
