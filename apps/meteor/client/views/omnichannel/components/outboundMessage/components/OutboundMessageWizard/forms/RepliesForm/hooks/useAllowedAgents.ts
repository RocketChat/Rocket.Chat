import type { Serialized, ILivechatDepartmentAgents, IUser } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

import { getAgentDerivedFromUser } from '../utils/getAgentDerivedFromUser';

type UseAllowedAgentsProps = {
	user: IUser | null;
	departmentId: string | undefined;
	canAssignSelfOnlyAgent: boolean;
	canAssignAnyAgent: boolean;
	queryAgents: Serialized<ILivechatDepartmentAgents>[] | undefined;
};

export const useAllowedAgents = ({ user, departmentId, queryAgents, canAssignSelfOnlyAgent, canAssignAnyAgent }: UseAllowedAgentsProps) =>
	useMemo(() => {
		// no department selected, no agents
		if (!departmentId) {
			return [];
		}

		// no permission to assign any agents, no agents
		if (!canAssignSelfOnlyAgent && !canAssignAnyAgent) {
			return [];
		}

		// can assign any agent, return all agents from query (if any)
		if (canAssignAnyAgent && queryAgents?.length) {
			return queryAgents;
		}

		try {
			// all other cases, attempt to derive agent from user
			return [getAgentDerivedFromUser(user, departmentId)];
		} catch {
			return [];
		}
	}, [canAssignAnyAgent, canAssignSelfOnlyAgent, user, departmentId, queryAgents]);
