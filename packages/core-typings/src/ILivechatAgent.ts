import type { IUser } from './IUser.js';

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
	agentLockedAt?: Date;
	agentLocked?: boolean;
}

export type AvailableAgentsAggregation = {
	agentId: string;
	username: string;
	maxChatsForAgent: number;
	queueInfo: { chats: number; chatsForDepartment?: number };
};
