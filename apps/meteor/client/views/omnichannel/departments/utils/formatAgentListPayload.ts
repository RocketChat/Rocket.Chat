import type { IDepartmentAgent } from '../EditDepartment';

export const formatAgentListPayload = (oldAgentList: IDepartmentAgent[], newAgentList: IDepartmentAgent[]) => {
	return {
		upsert: newAgentList.filter(
			(agent) =>
				!oldAgentList.some(
					(initialAgent) => initialAgent._id === agent._id && agent.count === initialAgent.count && agent.order === initialAgent.order,
				),
		),
		remove: oldAgentList.filter((initialAgent) => !newAgentList.some((agent) => initialAgent._id === agent._id)),
	};
};
