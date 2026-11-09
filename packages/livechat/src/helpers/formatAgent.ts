import { getAvatarUrl } from './baseUrl';

type AgentType = {
	_id: string;
	name: string;
	status: string;
	emails: [{ address: string }];
	username: string;
	phones?: { number: string; label?: string }[];
	customFields: { phone: string };
};

export const formatAgent = (agent: AgentType) => {
	if (!agent) {
		return;
	}

	return {
		_id: agent._id,
		name: agent.name,
		status: agent.status,
		email: agent.emails?.[0]?.address,
		username: agent.username,
		phone: agent.phones?.[0]?.number || agent.customFields?.phone,
		avatar: agent.username
			? {
					description: agent.username,
					src: getAvatarUrl(agent.username),
				}
			: undefined,
	};
};
