import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useMatrixServerList = () => {
	const fetchServerList = useEndpoint('GET', '/v1/federation/listServersByUser');
	return useQuery({
		queryKey: ['federation/listServersByUsers'],
		queryFn: async () => fetchServerList(),
		useErrorBoundary: true,
		staleTime: Infinity,
	});
};
