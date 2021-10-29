import { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import { parser } from '@rocket.chat/message-parser';

import { IRocketChatRecord } from '../IRocketChatRecord';
import { IUser } from '../IUser';
import { ChannelName, RoomID } from '../IRoom';
import { MessageAttachment } from './MessageAttachment/MessageAttachment';
import { FileProp } from './MessageAttachment/Files/FileProp';

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
	alias?: string;
}

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
