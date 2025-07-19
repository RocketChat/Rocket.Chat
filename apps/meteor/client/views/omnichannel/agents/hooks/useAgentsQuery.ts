import type { PaginatedRequest } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { omnichannelQueryKeys } from '../../../../lib/queryKeys';

export const useAgentsQuery = (query: PaginatedRequest = {}) => {
	const getAgents = useEndpoint('GET', '/v1/livechat/users/agent');

	return useQuery({
		queryKey: omnichannelQueryKeys.agentsAt(query),
		queryFn: () => getAgents(query),
	});
};
