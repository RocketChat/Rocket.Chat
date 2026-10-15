import type { PaginatedRequest } from '@rocket.chat/rest-typings';
import { usePaginatedQuery } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';

import { omnichannelQueryKeys } from '../../../../lib/queryKeys';

export const useAgentsQuery = (query: PaginatedRequest = {}) => {
	const getAgents = useEndpoint('GET', '/v1/livechat/users/agent');

	return usePaginatedQuery({
		query,
		getQueryKey: omnichannelQueryKeys.agents,
		queryFn: getAgents,
		itemsKey: 'users',
	});
};
