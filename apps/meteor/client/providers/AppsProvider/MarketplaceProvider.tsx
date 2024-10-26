import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { usePermission, useStream } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import React, { useEffect } from 'react';

import { storeQueryFunction } from './storeQueryFunction';
import { AppClientOrchestratorInstance } from '../../apps/orchestrator';
import { MarketplaceContext } from '../../contexts/MarketplaceContext';
import { useInvalidateLicense, useLicense } from '../../hooks/useLicense';
import type { AsyncState } from '../../lib/asyncState';
import { AsyncStatePhase } from '../../lib/asyncState';
import { useInvalidateAppsCountQueryCallback } from '../../views/marketplace/hooks/useAppsCountQuery';
import type { App } from '../../views/marketplace/types';

const getAppState = (
	loading: boolean,
	apps: App[] | undefined,
	error?: Error,
): AsyncState<{
	apps: App[];
}> => {
	if (error) {
		return {
			phase: AsyncStatePhase.REJECTED,
			value: undefined,
			error,
		};
	}

	return {
		phase: loading ? AsyncStatePhase.LOADING : AsyncStatePhase.RESOLVED,
		value: { apps: apps || [] },
		error,
	};
};

type MarketplaceProviderProps = {
	children: ReactNode;
};

const MarketplaceProvider = ({ children }: MarketplaceProviderProps) => {
	const canManageApps = usePermission('manage-apps');

	const queryClient = useQueryClient();

	const { isLoading: isLicenseInformationLoading, data: { license, limits } = {} } = useLicense({ loadValues: true });
	const isEnterprise = isLicenseInformationLoading ? undefined : !!license;

	const invalidateAppsCountQuery = useInvalidateAppsCountQueryCallback();
	const invalidateLicenseQuery = useInvalidateLicense();

	const stream = useStream('apps');

	const invalidate = useDebouncedCallback(
		() => {
			queryClient.invalidateQueries(['marketplace']);
			invalidateAppsCountQuery();
		},
		100,
		[],
	);

	useEffect(
		() =>
			stream('apps', ([key]) => {
				if (['app/added', 'app/removed', 'app/updated', 'app/statusUpdate', 'app/settingUpdated'].includes(key)) {
					invalidate();
				}
				if (['app/added', 'app/removed'].includes(key) && !isEnterprise) {
					invalidateLicenseQuery();
				}
			}),
		[invalidate, invalidateLicenseQuery, isEnterprise, stream],
	);

	const {
		isLoading: isMarketplaceDataLoading,
		data: marketplaceData,
		error: marketplaceError,
	} = useQuery({
		queryKey: ['marketplace', 'apps-stored', { canManageApps }],
		queryFn: async () => {
			const [appsFromMarketplace, installedApps] = await Promise.all([
				AppClientOrchestratorInstance.getAppsFromMarketplace(canManageApps),
				AppClientOrchestratorInstance.getInstalledApps(),
			]);

			if (appsFromMarketplace.error && typeof appsFromMarketplace.error === 'string') {
				throw new Error(appsFromMarketplace.error);
			}

			return storeQueryFunction(
				appsFromMarketplace.apps,
				installedApps.map((current: App) => ({
					...current,
					installed: true,
				})),
			);
		},
		keepPreviousData: true,
		refetchOnMount: 'always',
		staleTime: Infinity,
	});

	const [marketplaceAppsData, installedAppsData, privateAppsData] = marketplaceData || [];

	return (
		<MarketplaceContext.Provider
			children={children}
			value={{
				installedApps: getAppState(isMarketplaceDataLoading, installedAppsData),
				marketplaceApps: getAppState(
					isMarketplaceDataLoading,
					marketplaceAppsData,
					marketplaceError instanceof Error ? marketplaceError : undefined,
				),
				privateApps: getAppState(isMarketplaceDataLoading, privateAppsData),

				reload: async () => {
					await Promise.all([queryClient.invalidateQueries(['marketplace'])]);
				},
				orchestrator: AppClientOrchestratorInstance,
				privateAppsEnabled: (limits?.privateApps?.max ?? 0) !== 0,
			}}
		/>
	);
};

export default MarketplaceProvider;
