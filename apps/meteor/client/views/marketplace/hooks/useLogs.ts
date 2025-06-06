import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export const useLogs = ({
	appId,
	current,
	itemsPerPage,
	logLevel,
	method,
	startDate,
	endDate,
}: {
	appId: string;
	current: number;
	itemsPerPage: number;
	logLevel?: '0' | '1' | '2';
	method?: string;
	startDate?: string;
	endDate?: string;
}): UseQueryResult<OperationResult<'GET', '/apps/:id/logs'>> => {
	const query = useMemo(
		() => ({
			count: itemsPerPage,
			offset: current,
			...(logLevel && { logLevel }),
			...(method && { method }),
			...(startDate && { startDate }),
			...(endDate && { endDate }),
		}),
		[itemsPerPage, current, logLevel, method, startDate, endDate],
	);
	const logs = useEndpoint('GET', '/apps/:id/logs', { id: appId });

	return useQuery({
		queryKey: ['marketplace', 'apps', appId, 'logs', query],
		queryFn: () => logs(query),
	});
};
