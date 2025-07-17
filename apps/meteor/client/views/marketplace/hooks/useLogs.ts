import type { ILogItem } from '@rocket.chat/core-typings';
import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

export const useLogs = ({
	appId,
	current,
	itemsPerPage,
	logLevel,
	method,
	startDate,
	endDate,
	instanceId,
	updateExpandedStates,
}: {
	appId: string;
	current: number;
	itemsPerPage: number;
	logLevel?: '0' | '1' | '2';
	method?: string;
	startDate?: string;
	endDate?: string;
	instanceId?: string;
	updateExpandedStates: (logs: ILogItem[]) => void;
}): UseQueryResult<OperationResult<'GET', '/apps/:id/logs'>> => {
	const query = useMemo(
		() => ({
			count: itemsPerPage,
			offset: current,
			...(logLevel && { logLevel }),
			...(method && { method }),
			...(startDate && { startDate }),
			...(endDate && { endDate }),
			...(instanceId && { instanceId }),
		}),
		[itemsPerPage, current, logLevel, method, startDate, endDate, instanceId],
	);
	const logs = useEndpoint('GET', '/apps/:id/logs', { id: appId });

	return useQuery({
		queryKey: ['marketplace', 'apps', appId, 'logs', query],
		queryFn: () => logs(query),
		select: useCallback((result: OperationResult<'GET', '/apps/:id/logs'>) => {
			updateExpandedStates(result.logs);
			return result;
		}, []),
	});
};
