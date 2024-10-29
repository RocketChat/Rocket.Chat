import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useAppRequestsQuery = (appId: string, { offset, limit }: { offset?: number; limit?: number }) => {
	const fetchAppRequests = useEndpoint('GET', '/apps/app-request');

	return useQuery({
		queryKey: ['marketplace', 'apps', { appId }, 'requests', { offset, limit }] as const,
		queryFn: async () => {
			const { data, meta } = await fetchAppRequests({ appId, offset, limit });
			return { data: data ?? [], meta };
		},
		cacheTime: 0,
	});
};
