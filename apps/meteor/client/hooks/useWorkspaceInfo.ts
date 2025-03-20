import type { IStats, IWorkspaceInfo, Serialized } from '@rocket.chat/core-typings';
import type { IInstance } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useMutation, useQueries, useQueryClient } from '@tanstack/react-query';

export const useWorkspaceInfo = ({ refreshStatistics }: { refreshStatistics?: boolean } = {}) => {
	const getStatistics = useEndpoint('GET', '/v1/statistics');
	const getInstances = useEndpoint('GET', '/v1/instances.get');
	const getServerInfo = useEndpoint('GET', '/info');

	return useQueries({
		queries: [
			{
				queryKey: ['info', 'serverInfo'],
				queryFn: async () => {
					const data = await getServerInfo();

					if (!('minimumClientVersions' in data)) {
						throw new Error('Invalid server info');
					}
					if (!('info' in data)) {
						throw new Error('Invalid server info');
					}
					if (!('version' in data)) {
						throw new Error('Invalid server info');
					}

					return data as IWorkspaceInfo;
				},
				staleTime: Infinity,
				placeholderData: keepPreviousData,
			},
			{
				queryKey: ['info', 'instances'],
				queryFn: () => getInstances(),
				staleTime: Infinity,
				placeholderData: keepPreviousData,
				select(data: unknown) {
					const { instances } = data as Serialized<{ instances: IInstance[] }>;
					return instances.map((instance) => ({
						...instance,
						...(instance.instanceRecord && {
							instanceRecord: {
								...instance.instanceRecord,
								_createdAt: new Date(instance.instanceRecord._createdAt),
							},
						}),
					})) as IInstance[];
				},
			},
			{
				queryKey: ['info', 'statistics'],
				queryFn: () => getStatistics({ refresh: refreshStatistics ? 'true' : 'false' }),
				staleTime: Infinity,
				placeholderData: keepPreviousData,
				select: (data: unknown) => {
					const statsData = data as Serialized<IStats>;
					return {
						...statsData,
						lastMessageSentAt: statsData.lastMessageSentAt ? new Date(statsData.lastMessageSentAt) : undefined,
					};
				},
			},
		],
	});
};

export const useRefreshStatistics = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () =>
			queryClient.invalidateQueries({
				queryKey: ['info', 'statistics'],
			}),
	});
};
