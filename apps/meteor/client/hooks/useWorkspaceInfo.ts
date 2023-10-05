import type { IWorkspaceInfo, IStats } from '@rocket.chat/core-typings';
import type { IInstance } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueries } from '@tanstack/react-query';

export const useWorkspaceInfo = () => {
	const getStatistics = useEndpoint('GET', '/v1/statistics');
	const getInstances = useEndpoint('GET', '/v1/instances.get');
	const getServerInfo = useEndpoint('GET', '/info');

	const results = useQueries({
		queries: [
			{ queryKey: ['info', 'serverInfo'], queryFn: () => getServerInfo(), staleTime: Infinity, keepPreviousData: true },
			{ queryKey: ['info', 'instances'], queryFn: () => getInstances(), staleTime: Infinity, keepPreviousData: true },
			{ queryKey: ['info', 'statistics'], queryFn: () => getStatistics({ refresh: 'true' }), staleTime: Infinity, keepPreviousData: true },
		],
	});

	const [serverInfoQuery, instancesQuery, statisticsQuery] = results;

	const instances: IInstance[] | undefined = instancesQuery?.data?.instances as IInstance[];
	const statistics: IStats | undefined = statisticsQuery?.data as IStats;
	const serverInfo: IWorkspaceInfo | undefined = serverInfoQuery?.data as IWorkspaceInfo;

	const isLoading = results.some((query) => query.isLoading);
	const isError = results.some((query) => query.isError);

	return { instances, statistics, serverInfo, isLoading, isError, refetchStatistics: statisticsQuery.refetch };
};
