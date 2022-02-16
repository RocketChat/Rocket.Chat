import { IUser } from './IUser';

export enum ILivechatAgentStatus {
	AVAILABLE = 'available',
	UNAVAILABLE = 'unavailable',
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
