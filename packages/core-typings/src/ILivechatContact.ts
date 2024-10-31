import type { IVisitorEmail, IVisitorPhone } from './ILivechatVisitor';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IOmnichannelSource } from './IRoom';

export interface ILivechatContactChannel {
	name: string;
	verified: boolean;
	visitorId: string;
	blocked: boolean;
	field?: string;
	value?: string;
	verifiedAt?: Date;
	details: IOmnichannelSource;
	lastChat?: {
		_id: string;
		ts: Date;
	};
}

export interface ILivechatContactConflictingField {
	field: 'name' | 'manager' | `customFields.${string}`;
	value: string;
}

export interface ILivechatContact extends IRocketChatRecord {
	name: string;
	phones?: IVisitorPhone[];
	emails?: IVisitorEmail[];
	contactManager?: string;
	unknown?: boolean;
	conflictingFields?: ILivechatContactConflictingField[];
	customFields?: Record<string, string | unknown>;
	channels?: ILivechatContactChannel[];
	createdAt: Date;
	lastChat?: {
		_id: string;
		ts: Date;
	};
	importIds?: string[];
}
