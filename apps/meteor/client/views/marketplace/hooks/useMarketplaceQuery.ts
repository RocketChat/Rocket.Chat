import type { App } from '@rocket.chat/core-typings';
import { usePermission } from '@rocket.chat/ui-contexts';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { exhaustiveCheck } from '../../../../lib/utils/exhaustiveCheck';
import { MarketplaceUnsupportedVersionError } from '../lib/MarketplaceUnsupportedVersionError';
import { storeQueryFunction } from '../lib/storeQueryFunction';
import { useAppsOrchestrator } from './useAppsOrchestrator';
import { useMarketplaceContext } from './useMarketplaceContext';

type QueryData = {
	marketplace: App[];
	installed: App[];
	private: App[];
};

type UseMarketplaceQueryOptions<TData = QueryData> = Omit<
	UseQueryOptions<
		QueryData,
		Error,
		TData,
		readonly [
			'marketplace',
			'apps',
			{
				readonly canManageApps: boolean;
			},
		]
	>,
	'queryKey' | 'queryFn'
>;

type UseMarketplaceQueryResult<TData = QueryData> = UseQueryResult<TData, Error>;

export const useMarketplaceQuery = <TData = QueryData>(options?: UseMarketplaceQueryOptions<TData>): UseMarketplaceQueryResult<TData> => {
	const canManageApps = usePermission('manage-apps');

	const orchestrator = useAppsOrchestrator();

	return useQuery({
		queryKey: ['marketplace', 'apps', { canManageApps }] as const,
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

type UseMarketplaceQueryWithContextOptions<TData = App[]> = Omit<UseMarketplaceQueryOptions<TData>, 'select'> & {
	select?: (data: App[]) => TData;
};

export const useMarketplaceQueryWithContext = <TData = App[]>({
	select = (data: App[]) => data as TData,
	...options
}: UseMarketplaceQueryWithContextOptions<TData> = {}) => {
	const context = useMarketplaceContext();

	return useMarketplaceQuery({
		...options,
		select: (data) => {
			switch (context) {
				case 'premium':
				case 'explore':
				case 'requested':
					return select(data.marketplace);

				case 'private':
					return select(data.private);

				case 'installed':
					return select(data.installed);

				default:
					return exhaustiveCheck(context);
			}
		},
	});
};
