import { useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useAppRequestStats = () => {
	const canManageApp = usePermission('manage-apps');

	const fetchRequestStats = useEndpoint('GET', '/apps/app-request/stats');

	return useQuery({
		queryKey: ['app-requests-stats'],
		queryFn: async () => (await fetchRequestStats()).data,
		refetchOnWindowFocus: false,
		retry: false,
		enabled: canManageApp,
	});
};
