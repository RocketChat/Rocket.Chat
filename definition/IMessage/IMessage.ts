import { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import { parser } from '@rocket.chat/message-parser';

import { IRocketChatRecord } from '../IRocketChatRecord';
import { IUser } from '../IUser';
import { ChannelName, RoomID } from '../IRoom';
import { MessageAttachment } from './MessageAttachment/MessageAttachment';

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
	tlm?: Date;

	dcount?: number;
	tcount?: number;
	t?: MessageTypesValues;
	e2e?: 'pending';

	urls: any;
	file: any;
	attachments: MessageAttachment[];
}
