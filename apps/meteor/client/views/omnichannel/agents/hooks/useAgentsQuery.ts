import type { PaginatedRequest } from '@rocket.chat/rest-typings';
import { getCombineFn, usePaginatedQuery } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';

import { omnichannelQueryKeys } from '../../../../lib/queryKeys';

export const useAgentsQuery = (query: PaginatedRequest, { offset, count }: { offset: number; count: number }) => {
	const getAgents = useEndpoint('GET', '/v1/livechat/users/agent');

	return usePaginatedQuery({
		query,
		queryKey: omnichannelQueryKeys.agents(query),
		queryFn: getAgents,
		combineData: getCombineFn('users'),
		offset,
		count,
	});
};
