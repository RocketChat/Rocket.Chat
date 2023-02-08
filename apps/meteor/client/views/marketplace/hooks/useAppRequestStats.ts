import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useAppRequestStats = () => {
	const fetchRequestStats = useEndpoint('GET', '/apps/app-request/stats');

	return useQuery({
		queryKey: ['app-requests-stats'],
		queryFn: async () => fetchRequestStats(),
		refetchOnWindowFocus: false,
		retry: false,
	});
};
