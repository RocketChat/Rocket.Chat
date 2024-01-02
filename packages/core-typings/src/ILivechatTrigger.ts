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

export interface ILivechatSendMessageAction {
	name: 'send-message';
	params?: {
		sender: 'queue' | 'custom';
		msg: string;
		name: string;
	};
}

export interface ILivechatUseExternalServiceAction {
	name: 'use-external-service';
	params?: {
		serviceUrl: string;
		serviceTimeout: number;
		serviceFallbackMessage: string;
	};
}

export const isExternalServiceTrigger = (
	trigger: ILivechatTrigger,
): trigger is ILivechatTrigger & { actions: ILivechatUseExternalServiceAction[] } => {
	return trigger.actions.every((action) => action.name === 'use-external-service');
};

export const isSendMessageTrigger = (
	trigger: ILivechatTrigger,
): trigger is ILivechatTrigger & { actions: ILivechatSendMessageAction[] } => {
	return trigger.actions.every((action) => action.name === 'send-message');
};

export type ILivechatTriggerAction = ILivechatSendMessageAction | ILivechatUseExternalServiceAction;

export interface ILivechatTrigger extends IRocketChatRecord {
	name: string;
	description: string;
	enabled: boolean;
	runOnce: boolean;
	conditions: ILivechatTriggerCondition[];
	actions: ILivechatTriggerAction[];
}

export interface ILivechatTriggerActionResponse {
	_id: string;
	response: {
		statusCode: number;
		contents: {
			msg: string;
			order: number;
		}[];
	};
}
