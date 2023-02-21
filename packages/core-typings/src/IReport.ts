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

export interface IReport extends IRocketChatRecord {
	message: IMessage;
	description: string;
	ts: Date;
	userId: string;
	moderationInfo?: IModerationInfo;
	_hidden?: boolean;
}

export interface IModerationAudit {
	userId: IUser['_id'];
	username: IUser['username'];
	name: IUser['name'];
	message: IMessage['_id'];
	roomIds: IRoom['_id'][];
	ts: IReport['ts'];
	count: number;
}

export interface IUserReportedMessages {
	count: number;
	messages: IMessage[];
}

export interface IReportedMessageInfo {
	_id: IReport['_id'];
	description: IReport['description'];
	ts: IReport['ts'];
	reporter: Pick<IUser, '_id' | 'username' | 'avatarETag' | 'active' | 'name' | 'createdAt'>;
	count: number;
}
