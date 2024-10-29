import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useAppLogsQuery = (appId: string) => {
	const getLogs = useEndpoint('GET', '/apps/:id/logs', { id: appId });

	return useQuery({
		queryKey: ['marketplace', 'apps', { appId }, 'logs'] as const,
		queryFn: async () => {
			const { logs } = await getLogs();
			return logs;
		},
	});
};
