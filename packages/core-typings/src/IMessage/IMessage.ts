import type { UrlWithStringQuery } from 'url';

import type Icons from '@rocket.chat/icons';
import type { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import type { Root } from '@rocket.chat/message-parser';

import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { IUser } from '../IUser';
import type { IRoom, RoomID } from '../IRoom';
import type { MessageAttachment } from './MessageAttachment/MessageAttachment';
import type { FileProp } from './MessageAttachment/Files/FileProp';
import type { ILivechatVisitor } from '../ILivechatVisitor';

type MentionType = 'user' | 'team';

type MessageUrl = {
	url: string;
	source?: string;
	meta: Record<string, string>;
	headers?: { contentLength: string } | { contentType: string } | { contentLength: string; contentType: string };
	ignoreParse?: boolean;
	parsedUrl?: Pick<UrlWithStringQuery, 'host' | 'hash' | 'pathname' | 'protocol' | 'port' | 'query' | 'search' | 'hostname'>;
};

type VoipMessageTypesValues =
	| 'voip-call-started'
	| 'voip-call-declined'
	| 'voip-call-on-hold'
	| 'voip-call-unhold'
	| 'voip-call-ended'
	| 'voip-call-duration'
	| 'voip-call-wrapup'
	| 'voip-call-ended-unexpectedly';

type TeamMessageTypes =
	| 'removed-user-from-team'
	| 'added-user-to-team'
	| 'ult'
	| 'user-converted-to-team'
	| 'user-converted-to-channel'
	| 'user-removed-room-from-team'
	| 'user-deleted-room-from-team'
	| 'user-added-room-to-team'
	| 'ujt';

type LivechatMessageTypes =
	| 'livechat_navigation_history'
	| 'livechat_transfer_history'
	| 'livechat_transcript_history'
	| 'livechat_video_call'
	| 'livechat_transfer_history_fallback'
	| 'livechat-close'
	| 'livechat_webrtc_video_call'
	| 'livechat-started';

type OmnichannelTypesValues = 'omnichannel_placed_chat_on_hold' | 'omnichannel_on_hold_chat_resumed';

type OtrMessageTypeValues = 'otr' | 'otr-ack';

type OtrSystemMessages = 'user_joined_otr' | 'user_requested_otr_key_refresh' | 'user_key_refreshed_successfully';

export type MessageTypesValues =
	| 'e2e'
	| 'uj'
	| 'ul'
	| 'ru'
	| 'au'
	| 'mute_unmute'
	| 'r'
	| 'ut'
	| 'wm'
	| 'rm'
	| 'subscription-role-added'
	| 'subscription-role-removed'
	| 'room-archived'
	| 'room-unarchived'
	| 'room_changed_privacy'
	| 'room_changed_description'
	| 'room_changed_announcement'
	| 'room_changed_avatar'
	| 'room_changed_topic'
	| 'room_e2e_enabled'
	| 'room_e2e_disabled'
	| 'user-muted'
	| 'user-unmuted'
	| 'room-removed-read-only'
	| 'room-set-read-only'
	| 'room-allowed-reacting'
	| 'room-disallowed-reacting'
	| 'command'
	| 'videoconf'
	| LivechatMessageTypes
	| TeamMessageTypes
	| VoipMessageTypesValues
	| OmnichannelTypesValues
	| OtrMessageTypeValues
	| OtrSystemMessages;

export type TokenType = 'code' | 'inlinecode' | 'bold' | 'italic' | 'strike' | 'link';
export type Token = {
	token: string;
	text: string;
	type?: TokenType;
	noHtml?: string;
} & TokenExtra;

export type TokenExtra = {
	highlight?: boolean;
	noHtml?: string;
};

export interface IMessage extends IRocketChatRecord {
	rid: RoomID;
	msg: string;
	tmid?: string;
	tshow?: boolean;
	ts: Date;
	mentions?: ({
		type: MentionType;
	} & Pick<IUser, '_id' | 'username' | 'name'>)[];

	groupable?: false;
	channels?: Pick<IRoom, '_id' | 'name'>[];
	u: Required<Pick<IUser, '_id' | 'username' | 'name'>>;
	blocks?: MessageSurfaceLayout;
	alias?: string;
	md?: Root;

	_hidden?: boolean;
	imported?: boolean;
	replies?: IUser['_id'][];
	location?: {
		type: 'Point';
		coordinates: [number, number];
	};
	starred?: { _id: IUser['_id'] }[];
	pinned?: boolean;
	unread?: boolean;
	temp?: boolean;
	drid?: RoomID;
	tlm?: Date;

	dcount?: number;
	tcount?: number;
	t?: MessageTypesValues;
	e2e?: 'pending' | 'done';
	otrAck?: string;

	urls?: MessageUrl[];

	/** @deprecated Deprecated */
	actionLinks?: {
		icon: keyof typeof Icons;
		i18nLabel: unknown;
		label: string;
		method_id: string;
		params: string;
	}[];

	/** @deprecated Deprecated in favor of files */
	file?: FileProp;
	files?: FileProp[];
	attachments?: MessageAttachment[];

	reactions?: {
		[key: string]: { names?: (string | undefined)[]; usernames: string[]; federationReactionEventIds?: Record<string, string> };
	};

	private?: boolean;
	/* @deprecated */
	bot?: boolean;
	sentByEmail?: boolean;
	webRtcCallEndTs?: Date;
	role?: string;

	avatar?: string;
	emoji?: string;

	// Tokenization fields
	tokens?: Token[];
	html?: string;
	// Messages sent from visitors have this field
	token?: string;
	federation?: {
		eventId: string;
	};
}

export type MessageSystem = {
	t: 'system';
};

export interface IEditedMessage extends IMessage {
	editedAt: Date;
	editedBy: Pick<IUser, '_id' | 'username'>;
}

export const isEditedMessage = (message: IMessage): message is IEditedMessage => 'editedAt' in message && 'editedBy' in message;
export const isDeletedMessage = (message: IMessage): message is IEditedMessage =>
	'editedAt' in message && 'editedBy' in message && message.t === 'rm';
export const isMessageFromMatrixFederation = (message: IMessage): boolean =>
	'federation' in message && Boolean(message.federation?.eventId);

export interface ITranslatedMessage extends IMessage {
	translations: { [key: string]: string } & { original?: string };
	translationProvider: string;
	autoTranslateShowInverse?: boolean;
	autoTranslateFetching?: boolean;
}

export const isTranslatedMessage = (message: IMessage): message is ITranslatedMessage => 'translations' in message;

export interface IThreadMainMessage extends IMessage {
	tcount: number;
	tlm: Date;
	replies: IUser['_id'][];
}
export interface IThreadMessage extends IMessage {
	tmid: string;
}

export const isThreadMainMessage = (message: IMessage): message is IThreadMainMessage => 'tcount' in message && 'tlm' in message;

export const isThreadMessage = (message: IMessage): message is IThreadMessage => !!message.tmid;

export interface IDiscussionMessage extends IMessage {
	drid: string;
	dlm?: Date;
	dcount: number;
}

export const isDiscussionMessage = (message: IMessage): message is IDiscussionMessage => !!message.drid;

export interface IPrivateMessage extends IMessage {
	private: true;
}

export const isPrivateMessage = (message: IMessage): message is IPrivateMessage => !!message.private;

export interface IMessageReactionsNormalized extends IMessage {
	reactions: {
		[key: string]: {
			usernames: Required<IUser['_id']>[];
			names: Required<IUser>['name'][];
		};
	};
}

export const isMessageReactionsNormalized = (message: IMessage): message is IMessageReactionsNormalized =>
	Boolean('reactions' in message && message.reactions && message.reactions[0] && 'names' in message.reactions[0]);

export interface IOmnichannelSystemMessage extends IMessage {
	navigation?: {
		page: {
			title: string;
			location: {
				href: string;
			};
			token?: string;
		};
	};
	transferData?: {
		comment: string;
		transferredBy: {
			name?: string;
			username: string;
		};
		transferredTo: {
			name?: string;
			username: string;
		};
		nextDepartment?: {
			_id: string;
			name?: string;
		};
		scope: 'department' | 'agent' | 'queue';
	};
	requestData?: {
		type: 'visitor' | 'user';
		visitor?: ILivechatVisitor;
		user?: IUser;
	};
	webRtcCallEndTs?: Date;
	comment?: string;
}

export type IVoipMessage = IMessage & {
	voipData: {
		callDuration?: number;
		callStarted?: string;
		callWaitingTime?: string;
	};
};
export interface IMessageDiscussion extends IMessage {
	drid: RoomID;
}

export const isMessageDiscussion = (message: IMessage): message is IMessageDiscussion => {
	return 'drid' in message;
};

export type IMessageEdited = IMessage & {
	editedAt: Date;
	editedBy: Pick<IUser, '_id' | 'username'>;
};

export const isMessageEdited = (message: IMessage): message is IMessageEdited => {
	return 'editedAt' in message && 'editedBy' in message;
};

export type IMessageInbox = IMessage & {
	// email inbox fields
	email?: {
		references?: string[];
		messageId?: string;
	};
};

export const isIMessageInbox = (message: IMessage): message is IMessageInbox => 'email' in message;
export const isVoipMessage = (message: IMessage): message is IVoipMessage => 'voipData' in message;

export type IE2EEMessage = IMessage & {
	t: 'e2e';
	e2e: 'pending' | 'done';
};

export type IOTRMessage = IMessage & {
	t: 'otr' | 'otr-ack';
};

export const isE2EEMessage = (message: IMessage): message is IE2EEMessage => message.t === 'e2e';
export const isOTRMessage = (message: IMessage): message is IOTRMessage => message.t === 'otr' || message.t === 'otr-ack';
