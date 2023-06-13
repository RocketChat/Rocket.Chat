import type { ILivechatPriority } from './ILivechatPriority';
import type { IOmnichannelRoom, OmnichannelSourceType } from './IRoom';
import type { IOmnichannelServiceLevelAgreements } from './IOmnichannelServiceLevelAgreements';
import type { SelectedAgent } from './omnichannel/routing';
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
	OPEN = 'open',
}

export interface IVisitor {
	_id: string;
	username: string;
	token: string;
	status: 'online' | 'busy' | 'away' | 'offline';
	phone?: string | null;
	lastMessageTs?: Date;
}

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
	defaultAgent?: SelectedAgent;
	source: {
		type: OmnichannelSourceType;
	};
	// Note: for the sort order to be maintained, we're making priorityWeight and estimatedWaitingTimeQueue required
	priorityId?: IOmnichannelRoom['priorityId'];
	priorityWeight: ILivechatPriority['sortItem'];

	slaId?: string;
	estimatedWaitingTimeQueue: IOmnichannelServiceLevelAgreements['dueTimeInMinutes'];
}

export type InquiryWithAgentInfo = Pick<ILivechatInquiryRecord, '_id' | 'rid' | 'name' | 'ts' | 'status' | 'department' | 'v'> & {
	position?: number;
	defaultAgent?: { username: string; agentId: string };
};
