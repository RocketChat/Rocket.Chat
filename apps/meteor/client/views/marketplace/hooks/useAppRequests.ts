import type { AppRequestFilter } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useAppRequests = (appId: string, limit?: number, offset?: number, sort?: string, filter?: AppRequestFilter) => {
	const fetchAppRequests = useEndpoint('GET', '/apps/app-request');

	return useQuery({
		queryKey: ['app-requests', appId, limit, offset],
		queryFn: async () => fetchAppRequests({ appId, q: filter, sort, limit, offset }),
		gcTime: 0,
	});
};
