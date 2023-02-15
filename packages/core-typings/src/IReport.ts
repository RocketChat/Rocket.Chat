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
	reportedBy?: Pick<IUser, '_id' | 'username' | 'avatarETag' | 'active' | 'name' | 'createdAt'>;
	moderationInfo?: IModerationInfo;
	_hidden?: boolean;
}

export type MsgGroupedIReport = {
	_id: {
		message: IMessage['msg'];
		user: IUser['_id'];
	};
	reports: IReport[];
	count: number;
	roomMessageMap: {
		roomId: IRoom['_id'];
		msgId: IMessage['_id'];
	}[];
	reportIds: IReport['_id'][];
};
