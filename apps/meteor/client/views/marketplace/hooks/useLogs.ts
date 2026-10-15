import { usePaginatedQuery } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
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
}) => {
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
		getQueryKey: (query) => marketplaceQueryKeys.appLogs(appId, query),
		queryFn: logs,
		itemsKey: 'logs',
	});
};
