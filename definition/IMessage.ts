import { IRocketChatRecord } from './IRocketChatRecord';
import { IUser } from './IUser';
import { ChannelName, RoomID } from './IRoom';


export interface IAttachment {
	color?: string;
	text?: string;
	ts?: Date;
	thumb_url?: string;
	description?: string;
	message_link?: string;
	collapsed?: boolean;
	author_name?: string;
	author_link?: string;
	author_icon?: string;
	title?: string;
	title_link?: string;
	title_link_download?: string;
	image_url?: string;
	audio_url?: string;
	video_url?: string;
	fields?: string;
}

export interface IMessage extends IRocketChatRecord {
	rid: RoomID;
	msg: string;
	ts: Date;
	mentions?: {
		_id: string;
		name?: string;
	}[];
	attachments?: Array<IAttachment>;
	channels?: Array<ChannelName>;
	u: Pick<IUser, '_id' | 'username' | 'name'>;

	_hidden?: boolean;
	imported?: boolean;
	replies?: IUser['_id'][];
}
