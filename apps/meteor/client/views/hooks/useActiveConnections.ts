import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export const useActiveConnections = (): UseQueryResult<{ max: number; current: number; percentage: number }> => {
	const getConnections = useEndpoint('GET', '/v1/presence.getConnections');
	return useQuery({
		queryKey: ['userConnections'],

		queryFn: async () => {
			const { current, max } = await getConnections();
			return { current, max, percentage: Math.min((current / max) * 100, 100) };
		},

		staleTime: 1000 * 60,
	});
};
