import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

type useLogsParams = {
	appId: string;
	count: number;
	offset: number;
};

export const useLogs = ({ appId, count, offset }: useLogsParams): UseQueryResult<OperationResult<'GET', '/apps/:id/logs'>> => {
	const logs = useEndpoint('GET', '/apps/:id/logs', { id: appId });

	return useQuery({
		queryKey: ['marketplace', 'apps', appId, 'logs', count, offset],
		queryFn: () => logs({ count, offset }),
	});
};
