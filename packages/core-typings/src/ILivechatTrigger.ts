import type { IRocketChatRecord } from './IRocketChatRecord';

export enum ILivechatTriggerType {
	TIME_ON_SITE = 'time-on-site',
	PAGE_URL = 'page-url',
	CHAT_OPENED_BY_VISITOR = 'chat-opened-by-visitor',
	AFTER_GUEST_REGISTRATION = 'after-guest-registration',
}

export interface ILivechatTriggerCondition {
	name: ILivechatTriggerType;
	value?: string | number;
}

export interface ILivechatTriggerAction {
	name: 'send-message';
	params?: {
		sender: 'queue' | 'custom';
		msg: string;
		name: string;
	};
}

export interface ILivechatTrigger extends IRocketChatRecord {
	name: string;
	description: string;
	enabled: boolean;
	runOnce: boolean;
	conditions: ILivechatTriggerCondition[];
	actions: ILivechatTriggerAction[];
}
