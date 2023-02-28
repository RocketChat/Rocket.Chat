import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IMessage } from './IMessage/IMessage';
import type { IUser } from './IUser';
import type { IRoom } from './IRoom';

export interface IModerationInfo {
	moderatedBy: IUser['_id'];
	hiddenAt: Date;
	actionTaken: string;
	reasonForHiding: string;
}

export interface IRoomInfo {
	_id: IRoom['_id'];
	name: IRoom['name'];
}

export interface IMessageWithRoom extends IMessage {
	room: IRoomInfo;
}

export interface IReport extends IRocketChatRecord {
	message: IMessage;
	description: string;
	ts: Date;
	roomInfo: Pick<IRoom, '_id' | 'name' | 'fname' | 't' | 'federated'>;
	reportedBy: Pick<IUser, '_id' | 'username' | 'avatarETag' | 'active' | 'name' | 'createdAt'>;
	moderationInfo?: IModerationInfo;
	_hidden?: boolean;
}

// export interface IReport extends IRocketChatRecord {
// 	message: IMessage;
// 	description: string;
// 	ts: Date;
// 	userId: string;
// }

export interface IModerationAudit {
	userId: IUser['_id'];
	username: IUser['username'];
	name: IUser['name'];
	message: IMessage['msg'];
	msgId: IMessage['_id'];
	roomIds: IRoom['_id'][];
	ts: IReport['ts'];
	count: number;
	rooms: IRoomInfo[];
}

export interface IUserReportedMessages {
	count: number;
	messages: IMessageWithRoom[];
}

export interface IReportedMessageInfo {
	_id: IReport['_id'];
	description: IReport['description'];
	ts: IReport['ts'];
	reporter: Pick<IUser, '_id' | 'username' | 'avatarETag' | 'active' | 'name' | 'createdAt'>;
	count: number;
}
