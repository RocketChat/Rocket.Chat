import { IRocketChatRecord } from './IRocketChatRecord';

export enum LivechatInquiryStatus {
	QUEUED = 'queued',
	TAKEN = 'taken',
	READY = 'ready'
}

export interface IVisitor {
	_id: string;
	username: string;
	token: string;
	status: string;
}

export interface ILivechatInquiry extends IRocketChatRecord {
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
}
