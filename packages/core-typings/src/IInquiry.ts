import type { ILivechatPriority } from './ILivechatPriority';
import type { ILivechatVisitor } from './ILivechatVisitor';
import type { IMessage } from './IMessage';
import type { IOmnichannelServiceLevelAgreements } from './IOmnichannelServiceLevelAgreements';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IOmnichannelRoom, OmnichannelSourceType } from './IRoom';
import type { SelectedAgent } from './omnichannel/routing';

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

// This is a subset of the IVisitor interface + channel related fields
// IMPORTANT: If you're adding a new field here, make sure to update the
// apps-engine's room converter to include it too
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
	v: Pick<ILivechatVisitor, '_id' | 'username' | 'status' | 'name' | 'token' | 'phone' | 'activity'> & { lastMessageTs?: Date };
	t: 'l';

	department?: string;
	estimatedInactivityCloseTimeAt?: Date;
	locked?: boolean;
	lockedAt?: Date;
	lastMessage?: IMessage & { token?: string };
	defaultAgent?: SelectedAgent;
	source?: {
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
	defaultAgent?: SelectedAgent;
};
