import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useMarketplaceQuery } from './useMarketplaceQuery';

export const useFeaturedApps = () => {
	const { isLoading, isError, error, data } = useMarketplaceQuery();
	const featuredApps = useEndpoint('GET', '/apps/featured-apps');

	return useQuery({
		queryKey: ['marketplace', 'featured-apps'] as const,
		queryFn: async () => {
			if (isError) {
				throw error;
			}

			if (isLoading) {
				throw new Error('Unexpected state');
			}

			const apps = data.marketplace;

			const { sections } = await featuredApps();

			return sections.map((section) => {
				const featuredAppsIdList = section.apps.map((featuredApp) => featuredApp.latest.id);

				return {
					slug: section.slug,
					i18nLabel: section.i18nLabel,
					apps: apps.filter((app) => featuredAppsIdList.includes(app.id)),
				};
			});
		},
		staleTime: 10_000,
		enabled: !isLoading,
	});
};
