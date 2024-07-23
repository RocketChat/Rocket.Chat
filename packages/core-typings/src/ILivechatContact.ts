import type { IRocketChatRecord } from './IRocketChatRecord';

export interface ILivechatContactChannel {
	name: string;
	verified: boolean;
	visitorId: string;
}

export interface ILivechatContactConflictingField {
	field: string;
	oldValue: string;
	newValue: string;
}

export interface ILivechatContact extends IRocketChatRecord {
	name: string;
	phones?: string[];
	emails?: string[];
	contactManager?: string;
	unknown?: boolean;
	hasConflict?: boolean;
	conflictingFields?: ILivechatContactConflictingField[];
	customFields?: Record<string, string | unknown>;
	channels?: ILivechatContactChannel[];
}
