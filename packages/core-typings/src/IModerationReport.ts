import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IMessage } from './IMessage/IMessage';
import type { IUser } from './IUser';
import type { IRoom } from './IRoom';

export interface IModerationInfo {
	moderatedBy: IUser['_id'];
	hiddenAt: Date;
	action: string;
	reason: string;
}

export interface IModerationReport extends IRocketChatRecord {
	message: IMessage;
	description: string;
	ts: Date | string;
	room: Pick<IRoom, '_id' | 'name' | 'fname' | 't' | 'federated' | 'prid'>;
	reportedBy: Pick<IUser, '_id' | 'username' | 'name' | 'createdAt'>;
	moderationInfo?: IModerationInfo;
	_hidden?: boolean;
}

export interface IModerationAudit {
	userId: IUser['_id'];
	username: IUser['username'];
	name: IUser['name'];
	message: IMessage['msg'];
	msgId: IMessage['_id'];
	roomIds: IRoom['_id'][];
	ts: IModerationReport['ts'];
	rooms: IModerationReport['room'][];
	count: number;
}
