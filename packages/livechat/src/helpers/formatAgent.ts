import { getAvatarUrl } from './baseUrl';
import type { Agent } from '../definitions/agents';

export const formatAgent = (agent: Agent | undefined) => {
	if (!agent) {
		return undefined;
	}

	return {
		_id: agent._id,
		name: agent.name,
		status: agent.status,
		email: agent.emails?.[0]?.address,
		username: agent.username,
		phone: typeof agent.phone === 'string' ? agent.phone : agent.phone?.[0]?.phoneNumber || agent.customFields?.phone,
		avatar: agent.username
			? {
					description: agent.username,
					src: getAvatarUrl(agent.username),
				}
			: undefined,
	};
};
