import type { App } from '@rocket.chat/core-typings';
import { usePermission } from '@rocket.chat/ui-contexts';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { useAppsOrchestrator } from './useAppsOrchestrator';
import { MarketplaceUnsupportedVersionError } from '../lib/MarketplaceUnsupportedVersionError';
import { storeQueryFunction } from '../lib/storeQueryFunction';
import { marketplaceQueryKeys } from '../queryKeys';

type QueryData = {
	marketplace: App[];
	installed: App[];
	private: App[];
};

type UseMarketplaceQueryOptions<TData = QueryData> = Omit<
	UseQueryOptions<QueryData, Error, TData, ReturnType<typeof marketplaceQueryKeys.apps>>,
	'queryKey' | 'queryFn'
>;

type UseMarketplaceQueryResult<TData = QueryData> = UseQueryResult<TData, Error>;

export const useMarketplaceQuery = <TData = QueryData>(options?: UseMarketplaceQueryOptions<TData>): UseMarketplaceQueryResult<TData> => {
	const canManageApps = usePermission('manage-apps');

	const orchestrator = useAppsOrchestrator();

	return useQuery({
		queryKey: marketplaceQueryKeys.apps({ canManageApps }),
		queryFn: async () => {
			const [appsFromMarketplace, installedApps] = await Promise.all([
				orchestrator.getAppsFromMarketplace(canManageApps),
				orchestrator.getInstalledApps(),
			]);

			if (appsFromMarketplace.error && typeof appsFromMarketplace.error === 'string') {
				if (appsFromMarketplace.error === 'unsupported version') {
					throw new MarketplaceUnsupportedVersionError(appsFromMarketplace.error);
				}

				throw new Error(appsFromMarketplace.error);
			}

			const [marketplace, installed, _private] = storeQueryFunction(
				appsFromMarketplace.apps,
				installedApps.map((current: App) => ({
					...current,
					installed: true,
				})),
			);

			return { marketplace, installed, private: _private };
		},
		keepPreviousData: true,
		staleTime: Infinity,
		...options,
	});
};
