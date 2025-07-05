import type { Serialized, ILivechatDepartment, ILivechatAgent } from '@rocket.chat/core-typings';

export type RepliesFormSubmitPayload = {
	departmentId?: string;
	department?: Serialized<ILivechatDepartment>;
	agentId?: string;
	agent?: Pick<ILivechatAgent, '_id' | 'username' | 'name' | 'status' | 'statusLivechat' | 'emails' | 'livechat' | 'phone'>;
};
