import { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import { parser } from '@rocket.chat/message-parser';

import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { IUser } from '../IUser';
import type { ChannelName, RoomID } from '../IRoom';
import type { MessageAttachment } from './MessageAttachment/MessageAttachment';
import type { FileProp } from './MessageAttachment/Files/FileProp';

type MentionType = 'user' | 'team';


type MessageTypesValues =
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
| 'room_changed_avatar'
| 'room_changed_topic'
| 'room_e2e_enabled'
| 'room_e2e_disabled'
| 'livechat-close'


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
	u: Pick<IUser, '_id' | 'username' | 'name'>;
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
	starred?: {_id: IUser['_id']}[];
	pinned?: boolean;
	drid?: RoomID;

	dcount?: number;

	reactions?: {
		[key: string]: { usernames: IUser['_id'][] };
	};

	tcount?: number;
	t?: MessageTypesValues;
	e2e?: 'pending';

	urls: unknown[];
	/** @deprecated Deprecated in favor of files */
	file?: FileProp;
	files?: FileProp[];
	attachments?: MessageAttachment[];

	private?: boolean;
	/* @deprecated */
	bot?: boolean;
	sentByEmail?: boolean;
}

export interface IEditedMessage extends IMessage {
	editedAt: Date;
	editedBy: Pick<IUser, '_id' | 'username'>;
}

export const isEditedMessage = (message: IMessage): message is IEditedMessage => {
	return 'editedAt' in message && 'editedBy' in message;
};

export interface ITranslatedMessage extends IMessage {
	translations: {	[key: string]: unknown };
}

export const isTranslatedMessage = (message: IMessage): message is ITranslatedMessage => {
	return 'translations' in message;
};

export interface IThreadMessage extends IMessage {
	tcount: number;
	tmid: string;
	tlm: Date;
	replies: IUser['_id'][];
}

export const isThreadMessage = (message: IMessage): message is IThreadMessage => {
	return !!message.tcount;
};

export interface IDiscussionMessage extends IMessage {
	drid: string;
	dlm?: Date;
	dcount: number;
}

export const isDiscussionMessage = (message: IMessage): message is IDiscussionMessage => {
	return !!message.drid;
};


export interface IPrivateMessage extends IMessage {
	private: true;
}

export const isPrivateMessage = (message: IMessage): message is IPrivateMessage => {
	return !!message.private;
};


export interface IMessageReactionsNormalized extends IMessage {
	reactions: {
		[key: string]: {
			usernames: Required<IUser['_id']>[];
			names: Required<IUser>['name'][];
		};
	};
}


export const isMessageReactionsNormalized = (message: IMessage): message is IMessageReactionsNormalized => Boolean('reactions' in message && message.reactions && message.reactions[0] && 'names' in message.reactions[0]);
export type IMessageInbox = IMessage & {
	// email inbox fields
	email?: {
		references?: string[];
		messageId?: string;
	};
}

export const isIMessageInbox = (message: IMessage): message is IMessageInbox => 'email' in message;
