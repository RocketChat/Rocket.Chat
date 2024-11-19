import { useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { marketplaceQueryKeys } from '../queryKeys';

export const useAppRequestStats = () => {
	const canManageApp = usePermission('manage-apps');

	const fetchRequestStats = useEndpoint('GET', '/apps/app-request/stats');

	return useQuery({
		queryKey: marketplaceQueryKeys.appRequestStats(),
		queryFn: () => fetchRequestStats(),
		select: ({ data }) => data,
		refetchOnWindowFocus: false,
		retry: false,
		enabled: canManageApp,
	});
};
