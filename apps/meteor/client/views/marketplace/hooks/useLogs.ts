import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { marketplaceQueryKeys } from '../../../lib/queryKeys';

export const useLogs = ({
	appId,
	offset,
	count,
	logLevel,
	method,
	startDate,
	endDate,
	instanceId,
}: {
	appId: string;
	offset: number;
	count: number;
	logLevel?: '0' | '1' | '2';
	method?: string;
	startDate?: string;
	endDate?: string;
	instanceId?: string;
}): UseQueryResult<OperationResult<'GET', '/apps/:id/logs'>> => {
	const query = useMemo(
		() => ({
			count,
			offset,
			...(logLevel && { logLevel }),
			...(method && { method }),
			...(startDate && { startDate }),
			...(endDate && { endDate }),
			...(instanceId && { instanceId }),
		}),
		[count, offset, logLevel, method, startDate, endDate, instanceId],
	);
	const logs = useEndpoint('GET', '/apps/:id/logs', { id: appId });

	return useQuery({
		queryKey: marketplaceQueryKeys.appLogs(appId, query),
		queryFn: () => logs(query),
	});
};
