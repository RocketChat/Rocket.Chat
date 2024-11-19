import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { marketplaceQueryKeys } from '../queryKeys';

export const useAppLogsQuery = (appId: string) => {
	const getLogs = useEndpoint('GET', '/apps/:id/logs', { id: appId });

	return useQuery({
		queryKey: marketplaceQueryKeys.app.logs(appId),
		queryFn: async () => {
			const { logs } = await getLogs();
			return logs;
		},
	});
};
