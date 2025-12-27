import type { IAbacAttributeDefinition } from './IAbacAttribute';
import type { ILivechatDepartment } from './ILivechatDepartment';
import type { ILivechatPriority } from './ILivechatPriority';
import type { ILivechatVisitor } from './ILivechatVisitor';
import type { IMessage, MessageTypesValues } from './IMessage';
import type { IOmnichannelServiceLevelAgreements } from './IOmnichannelServiceLevelAgreements';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser, Username } from './IUser';
import type { RoomType } from './RoomType';

export type RoomID = string;
export type ChannelName = string;
interface IRequestTranscript {
	email: string; // the email address to send the transcript to
	subject: string; // the subject of the email
	requestedAt: Date;
	requestedBy: Pick<IUser, '_id' | 'username' | 'name' | 'utcOffset'>;
}

export interface IRoom extends IRocketChatRecord {
	_id: RoomID;
	t: RoomType;
	name?: string;
	fname?: string;
	msgs: number;
	default?: boolean;
	broadcast?: true;
	featured?: true;
	announcement?: string;
	joinCodeRequired?: boolean;
	announcementDetails?: {
		style?: string;
	};
	encrypted?: boolean;
	// The existence of an abac attribute definition indicates that ABAC is enabled for the room
	abacAttributes?: IAbacAttributeDefinition[];
	topic?: string;

	reactWhenReadOnly?: boolean;

	// TODO: this boolean might be an accident
	sysMes?: MessageTypesValues[] | boolean;

	u: Pick<IUser, '_id' | 'username' | 'name'>;
	uids?: Array<string>;

	lastMessage?: IMessage;
	lm?: Date;
	usersCount: number;
	webRtcCallStartTime?: Date;
	servedBy?: {
		_id: string;
	};

	prid?: string;
	avatarETag?: string;

	teamMain?: boolean;
	teamId?: string;
	teamDefault?: boolean;
	open?: boolean;

	autoTranslateLanguage?: string;
	autoTranslate?: boolean;
	unread?: number;
	alert?: boolean;
	hideUnreadStatus?: boolean;
	hideMentionStatus?: boolean;

	muted?: string[];
	unmuted?: string[];

	usernames?: string[];
	ts?: Date;

	cl?: boolean;
	ro?: boolean;
	favorite?: boolean;
	archived?: boolean;
	description?: string;
	e2eKeyId?: string;

	/* @deprecated */
	federated?: boolean;
	/* @deprecated */
	customFields?: Record<string, any>;

	usersWaitingForE2EKeys?: { userId: IUser['_id']; ts: Date }[];

	/**
	 * @deprecated Using `boolean` is deprecated. Use `number` instead.
	 */
	rolePrioritiesCreated?: number | boolean;
}

export const isRoomWithJoinCode = (room: Partial<IRoom>): room is IRoomWithJoinCode =>
	'joinCodeRequired' in room && (room as any).joinCodeRequired === true;

export interface IRoomWithJoinCode extends IRoom {
	joinCodeRequired: true;
	joinCode: string;
}

declare const __brand: unique symbol;
type Brand<B> = { [__brand]: B };
export type Branded<T, B> = T & Brand<B>;

export interface IRoomFederated extends IRoom {
	_id: Branded<string, 'IRoomFederated'>;
	federated: true;
}

export interface IRoomNativeFederated extends IRoomFederated {
	federation: {
		version: number;
		// Matrix's room ID. Example: !XqJXqZxXqJXq:matrix.org
		mrid: string;
		origin: string;
	};
}

export const isRoomFederated = (room: Partial<IRoom>): room is IRoomFederated => 'federated' in room && room.federated === true;

export const isRoomNativeFederated = (room: Partial<IRoom>): room is IRoomNativeFederated =>
	isRoomFederated(room) && 'federation' in room && room.federation !== undefined;

export interface ICreatedRoom extends IRoom {
	rid: string;
	inserted: boolean;
}

export interface ITeamRoom extends IRoom {
	teamMain: boolean;
	teamId: string;
}

export const isTeamRoom = (room: Partial<IRoom>): room is ITeamRoom => !!room.teamMain;
export const isPrivateTeamRoom = (room: Partial<IRoom>): room is ITeamRoom => isTeamRoom(room) && room.t === 'p';
export const isPublicTeamRoom = (room: Partial<IRoom>): room is ITeamRoom => isTeamRoom(room) && room.t === 'c';

export const isDiscussion = (room: Partial<IRoom>): room is IRoom => !!room.prid;
export const isPrivateDiscussion = (room: Partial<IRoom>): room is IRoom => isDiscussion(room) && room.t === 'p';
export const isPublicDiscussion = (room: Partial<IRoom>): room is IRoom => isDiscussion(room) && room.t === 'c';

export const isPublicRoom = (room: Partial<IRoom>): room is IRoom => room.t === 'c';
export const isPrivateRoom = (room: Partial<IRoom>): room is IRoom => room.t === 'p';

export interface IDirectMessageRoom extends Omit<IRoom, 'default' | 'featured' | 'u' | 'name'> {
	t: 'd';
	uids: Array<string>;
	usernames: Array<Username>;
}

export const isDirectMessageRoom = (room: Partial<IRoom> | IDirectMessageRoom): room is IDirectMessageRoom => room.t === 'd';
export const isMultipleDirectMessageRoom = (room: IRoom | IDirectMessageRoom): room is IDirectMessageRoom =>
	isDirectMessageRoom(room) && room.uids.length > 2;

export enum OmnichannelSourceType {
	WIDGET = 'widget',
	EMAIL = 'email',
	SMS = 'sms',
	APP = 'app',
	API = 'api',
	OTHER = 'other', // catch-all source type
}

export interface IOmnichannelSource {
	// TODO: looks like this is not so required as the definition suggests
	// The source, or client, which created the Omnichannel room
	type: OmnichannelSourceType;
	// An optional identification of external sources, such as an App
	id?: string;
	// A human readable alias that goes with the ID, for post analytical purposes
	alias?: string;
	// A label to be shown in the room info
	label?: string;
	// The sidebar icon
	sidebarIcon?: string;
	// The default sidebar icon
	defaultIcon?: string;
	// The destination of the message (e.g widget host, email address, whatsapp number, etc)
	destination?: string;
}

export interface IOmnichannelSourceFromApp extends IOmnichannelSource {
	type: OmnichannelSourceType.APP;
	id: string;
	label: string;
	sidebarIcon?: string;
	defaultIcon?: string;
	alias?: string;
	destination?: string;
}

export interface IOmnichannelGenericRoom extends Omit<IRoom, 'default' | 'featured' | 'broadcast'> {
	t: 'l';
	v: Pick<ILivechatVisitor, '_id' | 'username' | 'status' | 'name' | 'token' | 'activity'> & {
		lastMessageTs?: Date;
		phone?: string;
	};
	email?: {
		// Data used when the room is created from an email, via email Integration.
		inbox: string;
		thread: string[];
		replyTo: string;
		subject?: string;
	};
	source: IOmnichannelSource;

	// Note: this field is used only for email transcripts. For Pdf transcripts, we have a separate field.
	transcriptRequest?: IRequestTranscript;

	servedBy?: {
		_id: string;
		ts: Date;
		username: IUser['username'];
	};
	onHold?: boolean;
	departmentId?: string;

	lastMessage?: IMessage & { token?: string };

	tags?: string[];
	closedAt?: Date;
	metrics?: {
		serviceTimeDuration?: number;
	};
	// set to true when the room is waiting for a response from the visitor
	waitingResponse: any;
	// contains information about the last response from an agent
	responseBy?: {
		_id: string;
		username: string;

		// when the agent first responded to the visitor after the latest message from visitor
		// this will reset when the visitor sends a new message
		firstResponseTs: Date;

		// when the agent last responded to the visitor
		// This is almost the same as firstResponseTs, but here we hold the timestamp of the last response
		// and it gets updated after each message from agent
		// So if an agent sends multiple messages to visitor, then firstResponseTs will store timestamp
		// of their first reply, and lastMessageTs will store timestamp of their latest response
		lastMessageTs: Date;
	};

	livechatData: any;
	queuedAt?: Date;

	status?: 'queued' | 'taken' | 'ready'; // TODO: missing types for this

	ts: Date;
	label?: string;
	crmData?: unknown;

	// optional keys for closed rooms
	closer?: 'user' | 'visitor';
	closedBy?: {
		_id: string;
		username: IUser['username'];
	};
	closingMessage?: IMessage;

	departmentAncestors?: string[];

	contactId?: string;
}

export interface IOmnichannelRoom extends IOmnichannelGenericRoom {
	t: 'l';
	omnichannel?: {
		predictedVisitorAbandonmentAt: Date;
	};
	// sms field is used when the room is created from one of the internal SMS integrations (e.g. Twilio)
	sms?: {
		from: string;
	};

	// Following props are used for priorities feature
	priorityId?: string;
	priorityWeight: ILivechatPriority['sortItem']; // It should always have a default value for sorting mechanism to work

	// Following props are used for SLA feature
	slaId?: string;
	estimatedWaitingTimeQueue: IOmnichannelServiceLevelAgreements['dueTimeInMinutes']; // It should always have a default value for sorting mechanism to work

	// The ID of the pdf file generated for the transcript
	// This will help if we want to have this file shown on other places of the UI
	pdfTranscriptFileId?: string;

	metrics?: {
		serviceTimeDuration?: number;
		chatDuration?: number;
		v?: {
			lq: Date;
		};
		servedBy?: {
			lr: Date;
		};
		response?: {
			tt: number;
			total: number;
			avg: number;
			ft: number;
			fd?: number;
		};
		reaction?: {
			tt: number;
			ft: number;
			fd?: number;
		};
	};

	// Both fields are being used for the auto transfer feature for unanswered chats
	// which is controlled by Livechat_auto_transfer_chat_timeout setting
	autoTransferredAt?: Date;
	autoTransferOngoing?: boolean;

	verified?: boolean;
}

export interface IOmnichannelRoomFromAppSource extends IOmnichannelRoom {
	source: IOmnichannelSourceFromApp;
}

export type IOmnichannelRoomClosingInfo = Pick<IOmnichannelGenericRoom, 'closer' | 'closedBy' | 'closedAt' | 'tags'> & {
	serviceTimeDuration?: number;
	chatDuration: number;
};

export type IOmnichannelRoomWithDepartment = IOmnichannelRoom & { department?: ILivechatDepartment };

export const isOmnichannelRoom = (room: Pick<IRoom, 't'>): room is IOmnichannelRoom & IRoom => room.t === 'l';

export const isOmnichannelSourceFromApp = (source: IOmnichannelSource): source is IOmnichannelSourceFromApp => {
	return source?.type === OmnichannelSourceType.APP;
};

export type IOmnichannelRoomInfo = Pick<Partial<IOmnichannelRoom>, 'sms' | 'email'> & Pick<IOmnichannelRoom, 'source'>;

export type IOmnichannelRoomExtraData = Pick<Partial<IOmnichannelRoom>, 'customFields' | 'source'> & { sla?: string };

export type IOmnichannelInquiryExtraData = IOmnichannelRoomExtraData & { priority?: string };

export type RoomAdminFieldsType =
	| '_id'
	| 'prid'
	| 'fname'
	| 'name'
	| 't'
	| 'cl'
	| 'u'
	| 'usernames'
	| 'ts'
	| 'usersCount'
	| 'muted'
	| 'unmuted'
	| 'ro'
	| 'default'
	| 'favorite'
	| 'featured'
	| 'reactWhenReadOnly'
	| 'topic'
	| 'msgs'
	| 'archived'
	| 'teamId'
	| 'teamMain'
	| 'announcement'
	| 'description'
	| 'broadcast'
	| 'uids'
	| 'avatarETag'
	| 'abacAttributes';

export interface IRoomWithRetentionPolicy extends IRoom {
	retention: {
		enabled?: boolean;
		maxAge: number;
		filesOnly: boolean;
		excludePinned: boolean;
		ignoreThreads: boolean;
		overrideGlobal?: boolean;
	};
}

export const ROOM_ROLE_PRIORITY_MAP = {
	owner: 0,
	leader: 250,
	moderator: 500,
	default: 10000,
};
