import type { IMessage } from './IMessage';
import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IInquiry {
	_id: string;
	_updatedAt?: Date;
	department?: string;
}

export enum LivechatInquiryStatus {
	QUEUED = 'queued',
	TAKEN = 'taken',
	READY = 'ready',
}

export interface IVisitor {
	_id: string;
	username: string;
	token: string;
	status: string;
}

export interface ILivechatInquiryRecord extends IRocketChatRecord {
	rid: string;
	name: string;
	ts: Date;
	message: string;
	status: LivechatInquiryStatus;
	v: IVisitor;
	t: 'l';
	queueOrder: number;
	estimatedWaitingTimeQueue: number;
	estimatedServiceTimeAt: string;
	department: string;
	estimatedInactivityCloseTimeAt: Date;
	lastMessage?: IMessage & { token?: string };
}
