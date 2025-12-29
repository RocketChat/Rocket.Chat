import type { IRocketChatRecord } from './IRocketChatRecord';
import type { $brand } from './utils';

export interface ILivechatDepartmentAgents extends IRocketChatRecord {
	_id: string & $brand<'livechat-department-agents-id'>;
	departmentId: string;
	departmentEnabled: boolean;
	agentId: string;
	username: string;
	count: number;
	order: number;
}
