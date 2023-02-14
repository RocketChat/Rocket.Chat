import type { IUser } from './IUser';

export enum ILivechatAgentStatus {
	AVAILABLE = 'available',
	NOT_AVAILABLE = 'not-available',
}

export interface ILivechatAgent extends IUser {
	statusLivechat: ILivechatAgentStatus;
	livechat: {
		maxNumberSimultaneousChat: number;
	};
	livechatCount: number;
	lastRoutingTime: Date;
	livechatStatusSystemModified?: boolean;
}
