import type { OperationResult } from '@rocket.chat/rest-typings';
import type { PaginatedQueryResult } from '@rocket.chat/ui-client';
import { usePaginatedQuery } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { marketplaceQueryKeys } from '../../../lib/queryKeys';

export const useLogs = ({
	appId,
	current,
	itemsPerPage,
	logLevel,
	method,
	startDate,
	endDate,
	instanceId,
}: {
	appId: string;
	current: number;
	itemsPerPage: number;
	logLevel?: '0' | '1' | '2';
	method?: string;
	startDate?: string;
	endDate?: string;
	instanceId?: string;
}): PaginatedQueryResult<OperationResult<'GET', '/apps/:id/logs'>> => {
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
	const logs = useEndpoint('GET', '/apps/:id/logs', { id: appId });

	return usePaginatedQuery({
		query,
		queryKey: marketplaceQueryKeys.appLogs(appId, query),
		queryFn: logs,
		itemsKey: 'logs',
		offset: current,
		count: itemsPerPage,
	});
};
