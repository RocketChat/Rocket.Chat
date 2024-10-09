import type { IUser } from '@rocket.chat/core-typings';

export enum ILivechatAgentStatus {
	AVAILABLE = 'available',
	NOT_AVAILABLE = 'not-available',
}

export interface ILivechatAgent extends IUser {
	statusLivechat: ILivechatAgentStatus;
	livechat?: {
		maxNumberSimultaneousChat: number;
	};
	livechatCount: number;
	lastRoutingTime: Date;
	livechatStatusSystemModified?: boolean;
	openBusinessHours?: string[];
}
