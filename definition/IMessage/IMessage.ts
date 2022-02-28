import type Icons from '@rocket.chat/icons';
import { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import { parser } from '@rocket.chat/message-parser';

import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { IUser } from '../IUser';
import type { ChannelName, RoomID } from '../IRoom';
import type { MessageAttachment } from './MessageAttachment/MessageAttachment';
import type { FileProp } from './MessageAttachment/Files/FileProp';

type MentionType = 'user' | 'team';

type MessageUrl = {
	url: string;
	meta: Record<string, string>;
	headers?: { contentLength: string; contentType: string };
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

type OmnichannelTypesValues = 'livechat_transfer_history_fallback' | 'livechat-close';

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
	| 'room_archived'
	| 'room_unarchived'
	| 'room_changed_privacy'
	| 'room_changed_description'
	| 'room_changed_announcement'
	| 'room_changed_avatar'
	| 'room_changed_topic'
	| 'room_e2e_enabled'
	| 'room_e2e_disabled'
	| VoipMessageTypesValues
	| OmnichannelTypesValues
	| OtrSystemMessages;

export interface IMessage extends IRocketChatRecord {
	rid: RoomID;
	msg: string;

	tmid?: string;
	tlm?: Date;

	ts: Date;
	mentions?: ({
		type: MentionType;
	} & Pick<IUser, '_id' | 'username' | 'name'>)[];
	groupable?: false;
	channels?: Array<ChannelName>;
	u: Required<Pick<IUser, '_id' | 'username' | 'name'>>;
	blocks?: MessageSurfaceLayout;
	alias?: string;
	md?: ReturnType<typeof parser>;

	_hidden?: boolean;
	imported?: boolean;
	replies?: IUser['_id'][];
	location?: {
		type: 'Point';
		coordinates: [string, string];
	};
	starred?: { _id: IUser['_id'] }[];
	pinned?: boolean;
	drid?: RoomID;

	dcount?: number;

	reactions?: {
		[key: string]: { names?: (string | undefined)[]; usernames: string[] };
	};

	tcount?: number;
	t?: MessageTypesValues;
	e2e?: 'pending' | 'done';

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

	private?: boolean;
	/* @deprecated */
	bot?: boolean;
	sentByEmail?: boolean;
	webRtcCallEndTs?: Date;
	role?: string;

	avatar?: string;
	emoji?: string;
}

export type MessageSystem = {
	t: 'system';
};

export interface IEditedMessage extends IMessage {
	editedAt: Date;
	editedBy: Pick<IUser, '_id' | 'username'>;
}

export const isEditedMessage = (message: IMessage): message is IEditedMessage => 'editedAt' in message && 'editedBy' in message;

export interface ITranslatedMessage extends IMessage {
	translations: { [key: string]: unknown };
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
export type IVoipMessage = IMessage & {
	voipData: {
		callDuration?: number;
		callStarted?: string;
		callWaitingTime?: string;
	};
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
