import { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import { parser } from '@rocket.chat/message-parser';

import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { IUser } from '../IUser';
import type { ChannelName, RoomID } from '../IRoom';
import type { MessageAttachment } from './MessageAttachment/MessageAttachment';
import type { FileProp } from './MessageAttachment/Files/FileProp';

type MentionType = 'user' | 'team';

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
	ts: Date;
	mentions?: {
		_id: string;
		type: MentionType;
		name?: string;
		username?: string;
	}[];
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
	starred?: { _id: IUser['_id'] }[];
	pinned?: boolean;
	drid?: RoomID;
	tlm?: Date;

	dcount?: number;
	tcount?: number;
	t?: MessageTypesValues;
	e2e?: 'pending';

	urls: any;
	/** @deprecated Deprecated in favor of files */
	file?: FileProp;
	files?: FileProp[];
	attachments?: MessageAttachment[];
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
