import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IMessage } from './IMessage/IMessage';
import type { IUser } from './IUser';
import type { IRoom } from './IRoom';

/**
 * Right now we're assuming neither Room Info or User Info changes.
 * There's no update method referencing reports as of now (6.3.0-develop).
 * This means that a possible user or room change will not be reflected in the report.
 */
export interface IModerationInfo {
	moderatedBy: IUser['_id'];
	hiddenAt: Date;
	action: string;
	reason: string;
}

export interface IModerationReport extends IRocketChatRecord {
	message?: IMessage;
	room?: Pick<IRoom, '_id' | 'name' | 'fname' | 't' | 'federated' | 'prid'>;
	reportedUser?: Pick<IUser, '_id' | 'username' | 'name'>;
	description: string;
	ts: Date | string;
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
