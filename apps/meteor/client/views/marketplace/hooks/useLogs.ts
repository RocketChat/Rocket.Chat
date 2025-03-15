import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import type { DateRange } from '../../audit/utils/dateRange';

export type LogsFilters = {
	logLevel: '0' | '1' | '2';
	dateRange?: DateRange;
	method?: string;
};

type useLogsParams = {
	appId: string;
	count: number;
	offset: number;
	filters?: LogsFilters;
};

export const useLogs = ({ appId, count, offset, filters }: useLogsParams): UseQueryResult<OperationResult<'GET', '/apps/:id/logs'>> => {
	const logs = useEndpoint('GET', '/apps/:id/logs', { id: appId });
	const { logLevel, method, dateRange } = filters || {};
	const startDate = dateRange?.start?.toJSON();
	const endDate = dateRange?.end?.toJSON();

	return useQuery({
		queryKey: ['marketplace', 'apps', appId, 'logs', count, offset, filters],
		queryFn: () => logs({ count, offset, logLevel, method, startDate, endDate }),
	});
};
