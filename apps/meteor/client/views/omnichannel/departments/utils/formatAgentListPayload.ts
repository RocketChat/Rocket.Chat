import type { IDepartmentAgent } from '../definitions';

export const formatAgentListPayload = (oldAgentList: IDepartmentAgent[], newAgentList: IDepartmentAgent[]) => {
	const upsert: Pick<IDepartmentAgent, 'agentId' | 'username' | 'count' | 'order'>[] = [];
	const remove: Pick<IDepartmentAgent, 'agentId' | 'username'>[] = [];

	for (const agent of newAgentList) {
		const initialAgent = agent._id ? oldAgentList.find((initialAgent) => initialAgent._id === agent._id) : undefined;

		if (!initialAgent || agent.count !== initialAgent.count || agent.order !== initialAgent.order) {
			upsert.push({ agentId: agent.agentId, username: agent.username, count: agent.count, order: agent.order });
		}
	}

	for (const initialAgent of oldAgentList) {
		if (!newAgentList.some((agent) => initialAgent._id === agent._id)) {
			remove.push({ agentId: initialAgent.agentId, username: initialAgent.username });
		}
	}

	return { upsert, remove };
};
