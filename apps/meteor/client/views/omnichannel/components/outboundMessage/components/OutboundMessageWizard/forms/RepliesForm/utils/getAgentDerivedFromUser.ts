import type { ILivechatDepartmentAgents, Serialized, IUser } from '@rocket.chat/core-typings';

const isOmnichannelAgent = (user: IUser | null): user is IUser => (user ? user.roles.includes('livechat-agent') : false);

export const getAgentDerivedFromUser = (user: IUser | null, departmentId: string): Serialized<ILivechatDepartmentAgents> => {
	if (!isOmnichannelAgent(user)) {
		throw new Error('User is not a livechat agent');
	}

	return {
		agentId: user._id,
		username: user.username || '',
		_id: user._id,
		_updatedAt: new Date().toISOString(),
		departmentId,
		departmentEnabled: true,
		count: 0,
		order: 0,
	};
};
