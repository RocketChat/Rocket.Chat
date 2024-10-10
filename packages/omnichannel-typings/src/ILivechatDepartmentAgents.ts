import type { IRocketChatRecord } from '@rocket.chat/core-typings';

export interface ILivechatDepartmentAgents extends IRocketChatRecord {
	departmentId: string;
	departmentEnabled: boolean;
	agentId: string;
	username: string;
	count: number;
	order: number;
}
