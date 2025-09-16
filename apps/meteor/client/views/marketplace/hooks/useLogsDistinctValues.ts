import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export const useLogsDistinctValues = (appId: string): UseQueryResult<OperationResult<'GET', '/apps/:id/logs/distinctValues'>> => {
	const getValues = useEndpoint('GET', '/apps/:id/logs/distinctValues', { id: appId });

	return useQuery({
		queryKey: ['app-logs-filter-distinct-values', appId],
		queryFn: async () => getValues(),
	});
};
