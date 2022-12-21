import type { ILivechatPriority, IOmnichannelRoom } from '@rocket.chat/core-typings/src';

import type { IUser } from './IUser';
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
	status: 'online' | 'busy' | 'away' | 'offline';
	phone?: string | null;
}

export const DEFAULT_SLA_INQUIRY_CONFIG = {
	ESTIMATED_WAITING_TIME_QUEUE: 9999999,
	ESTIMATED_SERVICE_TIME: new Date('2999-12-31T23:59:59.999Z'),
};

export interface ILivechatInquiryRecord extends IRocketChatRecord {
	rid: string;
	name: string;
	ts: Date;
	message: string;
	status: LivechatInquiryStatus;
	v: IVisitor;
	t: 'l';

	department: string;
	estimatedInactivityCloseTimeAt: Date;
	locked?: boolean;
	lockedAt?: Date;
	lastMessage?: IMessage & { token?: string };
	defaultAgent?: {
		agentId: IUser['_id'];
		username?: IUser['username'];
	};

	// Note: for the sort order to be maintained, we're making priorityWeight, estimatedWaitingTimeQueue, and estimatedServiceTimeAt required
	priorityId?: IOmnichannelRoom['priorityId'];
	priorityWeight: ILivechatPriority['sortItem'];

	slaId?: string;
	estimatedWaitingTimeQueue: number;
	estimatedServiceTimeAt: Date;
}
