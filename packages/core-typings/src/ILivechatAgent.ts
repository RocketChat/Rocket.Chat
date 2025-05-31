import type { IUser } from './IUser';

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

export type AvailableAgentsAggregation = {
	agentId: string;
	username: string;
	maxChatsForAgent: number;
	queueInfo: { chats: number; chatsForDepartment?: number };
};
