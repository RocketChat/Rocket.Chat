import type { App } from '@rocket.chat/core-typings';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { storeQueryFunction } from '../lib/storeQueryFunction';
import { useAppsOrchestrator } from './useAppsOrchestrator';

export const useMarketplaceQuery = () => {
	const canManageApps = usePermission('manage-apps');

	const orchestrator = useAppsOrchestrator();

	return useQuery({
		queryKey: ['marketplace', 'apps-stored', { canManageApps }] as const,
		queryFn: async () => {
			const [appsFromMarketplace, installedApps] = await Promise.all([
				orchestrator.getAppsFromMarketplace(canManageApps),
				orchestrator.getInstalledApps(),
			]);

			if (appsFromMarketplace.error && typeof appsFromMarketplace.error === 'string') {
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
	});
};
