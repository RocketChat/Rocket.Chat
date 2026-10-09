import { RoomType } from '../rooms';
import type { IRoom } from '../rooms/IRoom';
import type { IUser } from '../users';
import type { IDepartment } from './IDepartment';
import type { ILivechatContact } from './ILivechatContact';
import type { IVisitor } from './IVisitor';

/** The channel a Livechat conversation reached the workspace over. */
export enum OmnichannelSourceType {
	WIDGET = 'widget',
	EMAIL = 'email',
	SMS = 'sms',
	APP = 'app',
	API = 'api',
	OTHER = 'other',
}

/** Where a Livechat conversation came from, and how to present that to an agent. */
export interface IOmnichannelSource {
	/** The channel the conversation came over. */
	type: OmnichannelSourceType;
	/** Identifies the external source, an App for instance. */
	id?: string;
	/** A readable name for the source, for reporting on it afterwards. */
	alias?: string;
	/** What to show as the source in the room's info panel. */
	label?: string;
	/** The icon to mark the room with in the sidebar. */
	sidebarIcon?: string;
	/** The icon to fall back to when `sidebarIcon` is not set. */
	defaultIcon?: string;
	/** Where the messages go: a widget host, an email address, a WhatsApp number. */
	destination?: string;
}

/** An {@link IOmnichannelSource} that an App brought the conversation in through. */
interface IOmnichannelSourceApp {
	type: 'app';
	/** Identifies the App the conversation came through. */
	id?: string;
	/** A readable name for the source, for reporting on it afterwards. */
	alias?: string;
	/** What to show as the source in the room's info panel. */
	label?: string;
	/** The icon to mark the room with in the sidebar. */
	sidebarIcon?: string;
	/** The icon to fall back to when `sidebarIcon` is not set. */
	defaultIcon?: string;
	/** Where the messages go: a widget host, an email address, a WhatsApp number. */
	destination?: string;
}

/**
 * A conversation's source, narrowed by its `type`.
 *
 * Only a source of type `app` carries the descriptive fields; use
 * {@link isLivechatFromApp} to reach them.
 */
export type OmnichannelSource =
	| {
			type: Exclude<OmnichannelSourceType, 'app'>;
	  }
	| IOmnichannelSourceApp;

/** What the channel itself reports about the visitor on the other end. */
export interface IVisitorChannelInfo {
	/** When the visitor last wrote on this channel. */
	lastMessageTs?: Date;
	/** The number the visitor is reachable at on this channel. */
	phone?: string;
}

/**
 * A conversation with a Livechat visitor.
 *
 * Narrow an `IRoom` to one with {@link isLivechatRoom} rather than checking
 * `type` yourself.
 */
export interface ILivechatRoom extends IRoom {
	/** The visitor on the other end. */
	visitor: IVisitor;
	/** What the channel reports about the visitor. */
	visitorChannelInfo?: IVisitorChannelInfo;
	/** The department the conversation is routed to. */
	department?: IDepartment;
	/** Which side ended the conversation. */
	closer: 'user' | 'visitor' | 'bot';
	/** The agent who ended the conversation, when an agent did. */
	closedBy?: IUser;
	/** The agent the conversation is assigned to. */
	servedBy?: IUser;
	/** The agent who last answered the visitor. */
	responseBy?: IUser;
	/** Whether the workspace is waiting on the visitor to reply. */
	isWaitingResponse: boolean;
	/** Whether the conversation is still running. */
	isOpen: boolean;
	/** When the conversation ended. */
	closedAt?: Date;
	/** Where the conversation came from. */
	source?: OmnichannelSource;
	/** The contact the visitor belongs to. */
	contact?: ILivechatContact;
}

/** Narrows a room to a Livechat conversation. */
export const isLivechatRoom = (room: IRoom): room is ILivechatRoom => {
	return room.type === RoomType.LIVE_CHAT;
};
/** Narrows a Livechat conversation to one an App brought in, whose source carries the descriptive fields. */
export const isLivechatFromApp = (room: ILivechatRoom): room is ILivechatRoom & { source: IOmnichannelSourceApp } => {
	return room.source?.type === 'app';
};
