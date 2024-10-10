import type { IRocketChatRecord } from '@rocket.chat/core-typings';

export interface ILivechatAgentActivity extends IRocketChatRecord {
	agentId: string;
	date: number;
	lastStartedAt: Date;
	availableTime: number;
	serviceHistory: IServiceHistory[];
	lastStoppedAt?: Date;
}

export interface IServiceHistory {
	startedAt: Date;
	stoppedAt: Date;
}
