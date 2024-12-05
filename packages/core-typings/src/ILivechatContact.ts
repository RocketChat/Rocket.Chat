import type { IVisitorEmail, IVisitorPhone } from './ILivechatVisitor';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IOmnichannelSource, OmnichannelSourceType } from './IRoom';

export interface ILivechatContactVisitorAssociation {
	visitorId: string;
	source: {
		type: OmnichannelSourceType;
		id?: IOmnichannelSource['id'];
	};
}

export interface ILivechatContactChannel {
	name: string;
	verified: boolean;
	visitor: ILivechatContactVisitorAssociation;
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
	channels: ILivechatContactChannel[];
	createdAt: Date;
	lastChat?: {
		_id: string;
		ts: Date;
	};
	importIds?: string[];

	// Expected string format is YYYY-MM
	activity?: string[];

	// When preRegistration is true, the contact was added by an admin and it doesn't have any visitor association yet
	// This contact may then be linked to new visitors that use the same email address or phone number
	preRegistration?: boolean;
}
