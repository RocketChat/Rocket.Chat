import type { OperationResult } from '@rocket.chat/rest-typings';
import { usePaginatedQueryKey } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { marketplaceQueryKeys } from '../../../lib/queryKeys';

export const useLogs = ({
	appId,
	logLevel,
	method,
	startDate,
	endDate,
	instanceId,
}: {
	appId: string;
	logLevel?: '0' | '1' | '2';
	method?: string;
	startDate?: string;
	endDate?: string;
	instanceId?: string;
}): UseQueryResult<OperationResult<'GET', '/apps/:id/logs'>> & {
	paginationProps: ReturnType<typeof usePaginatedQueryKey>['paginationProps'];
} => {
	const query = useMemo(
		() => ({
			...(logLevel && { logLevel }),
			...(method && { method }),
			...(startDate && { startDate }),
			...(endDate && { endDate }),
			...(instanceId && { instanceId }),
		}),
		[logLevel, method, startDate, endDate, instanceId],
	);
	const { paginatedQuery, queryKey, paginationProps } = usePaginatedQueryKey({
		query,
		getQueryKey: (query) => marketplaceQueryKeys.appLogs(appId, query),
	});
	const logs = useEndpoint('GET', '/apps/:id/logs', { id: appId });

	const result = useQuery({
		queryKey,
		queryFn: () => logs(paginatedQuery),
	});

	return { ...result, paginationProps };
};
