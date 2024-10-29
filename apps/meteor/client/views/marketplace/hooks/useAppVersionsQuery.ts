import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const useAppVersionsQuery = (appId: string) => {
	const { t } = useTranslation();

	const getVersions = useEndpoint('GET', '/apps/:id/versions', { id: appId });

	return useQuery({
		queryKey: ['marketplace', 'apps', { appId }, 'versions'] as const,
		queryFn: async () => {
			const { apps } = await getVersions();

			if (apps.length === 0) {
				throw new Error(t('No_results_found'));
			}

			return apps;
		},
		staleTime: 10_000,
	});
};
