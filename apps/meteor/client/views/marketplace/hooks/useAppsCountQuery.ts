import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import type { MarketplaceContext } from './useMarketplaceContext';

export const useAppsCountQuery = (context: MarketplaceContext) => {
	const getAppsCount = useEndpoint('GET', '/apps/count');

	return useQuery(
		['apps/count', context],
		async () => {
			const data = await getAppsCount();

			const numberOfEnabledApps = context === 'private' ? data.totalPrivateEnabled : data.totalMarketplaceEnabled;
			const enabledAppsLimit = context === 'private' ? data.maxPrivateApps : data.maxMarketplaceApps;
			const hasUnlimitedApps = enabledAppsLimit === -1;

			return {
				hasUnlimitedApps,
				enabled: numberOfEnabledApps,
				limit: enabledAppsLimit,
			};
		},
		{ staleTime: 10_000 },
	);
};
