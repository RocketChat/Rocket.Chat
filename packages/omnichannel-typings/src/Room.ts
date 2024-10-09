import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

import type { ILivechatPriority } from './ILivechatPriority';
import type { ILivechatVisitor } from './ILivechatVisitor';
import type { IOmnichannelServiceLevelAgreements } from './IOmnichannelServiceLevelAgreements';

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
}

export interface IOmnichannelSourceFromApp extends IOmnichannelSource {
	type: OmnichannelSourceType.APP;
	id: string;
	label: string;
	sidebarIcon?: string;
	defaultIcon?: string;
	alias?: string;
}

interface IRequestTranscript {
	email: string; // the email address to send the transcript to
	subject: string; // the subject of the email
	requestedAt: Date;
	requestedBy: Pick<IUser, '_id' | 'username' | 'name' | 'utcOffset'>;
}

export interface IOmnichannelGenericRoom extends Omit<IRoom, 'default' | 'featured' | 'broadcast'> {
	t: 'l' | 'v';
	v: Pick<ILivechatVisitor, '_id' | 'username' | 'status' | 'name' | 'token' | 'activity'> & {
		lastMessageTs?: Date;
		phone?: string;
	};
	email?: {
		// Data used when the room is created from an email, via email Integration.
		inbox: string;
		thread: string[];
		replyTo: string;
		subject: string;
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

	// Signals if the room already has a pdf transcript requested
	// This prevents the user from requesting a transcript multiple times
	pdfTranscriptRequested?: boolean;
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
}

export interface IVoipRoom extends IOmnichannelGenericRoom {
	t: 'v';
	name: string;
	// The timestamp when call was started
	callStarted: Date;
	// The amount of time the call lasted, in milliseconds
	callDuration?: number;
	// The amount of time call was in queue in milliseconds
	callWaitingTime?: number;
	// The total of hold time for call (calculated at closing time) in seconds
	callTotalHoldTime?: number;
	// The pbx queue the call belongs to
	queue: string;
	// The ID assigned to the call (opaque ID)
	callUniqueId?: string;
	v: Pick<ILivechatVisitor, '_id' | 'username' | 'status' | 'name' | 'token'> & { lastMessageTs?: Date; phone?: string };
	// Outbound means the call was initiated from Rocket.Chat and vise versa
	direction: 'inbound' | 'outbound';
}

export interface IOmnichannelRoomFromAppSource extends IOmnichannelRoom {
	source: IOmnichannelSourceFromApp;
}

export type IVoipRoomClosingInfo = Pick<IOmnichannelGenericRoom, 'closer' | 'closedBy' | 'closedAt' | 'tags'> &
	Pick<IVoipRoom, 'callDuration' | 'callTotalHoldTime'> & {
		serviceTimeDuration?: number;
	};

export type IOmnichannelRoomClosingInfo = Pick<IOmnichannelGenericRoom, 'closer' | 'closedBy' | 'closedAt' | 'tags'> & {
	serviceTimeDuration?: number;
	chatDuration: number;
};

export const isOmnichannelRoom = (room: Pick<IRoom, 't'>): room is IOmnichannelRoom & IRoom => room.t === 'l';

export const isVoipRoom = (room: IRoom): room is IVoipRoom & IRoom => room.t === 'v';

export const isOmnichannelSourceFromApp = (source: IOmnichannelSource): source is IOmnichannelSourceFromApp => {
	return source?.type === OmnichannelSourceType.APP;
};
