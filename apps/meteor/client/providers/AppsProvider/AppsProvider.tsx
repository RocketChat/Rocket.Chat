import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { usePermission, useStream } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import React, { useEffect } from 'react';

import { storeQueryFunction } from './storeQueryFunction';
import { AppClientOrchestratorInstance } from '../../apps/orchestrator';
import { AppsContext } from '../../contexts/AppsContext';
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

type AppsProviderProps = {
	children: ReactNode;
};

const AppsProvider = ({ children }: AppsProviderProps) => {
	const isAdminUser = usePermission('manage-apps');

	const queryClient = useQueryClient();

	const { isLoading: isLicenseInformationLoading, data: { license, limits } = {} } = useLicense({ loadValues: true });
	const isEnterprise = isLicenseInformationLoading ? undefined : !!license;

	const invalidateAppsCountQuery = useInvalidateAppsCountQueryCallback();
	const invalidateLicenseQuery = useInvalidateLicense();

	const stream = useStream('apps');

	const invalidate = useDebouncedCallback(
		() => {
			queryClient.invalidateQueries(['marketplace', 'apps-instance']);
			invalidateAppsCountQuery();
		},
		100,
		[],
	);

	useEffect(() => {
		return stream('apps', ([key]) => {
			if (['app/added', 'app/removed', 'app/updated', 'app/statusUpdate', 'app/settingUpdated'].includes(key)) {
				invalidate();
			}
			if (['app/added', 'app/removed'].includes(key) && !isEnterprise) {
				invalidateLicenseQuery();
			}
		});
	}, [invalidate, invalidateLicenseQuery, isEnterprise, stream]);

	const marketplace = useQuery(
		['marketplace', 'apps-marketplace', isAdminUser],
		async () => {
			const result = await AppClientOrchestratorInstance.getAppsFromMarketplace(isAdminUser);
			queryClient.invalidateQueries(['marketplace', 'apps-stored']);
			if (result.error && typeof result.error === 'string') {
				throw new Error(result.error);
			}
			return result.apps;
		},
		{
			staleTime: Infinity,
			keepPreviousData: true,
			onSettled: () => queryClient.invalidateQueries(['marketplace', 'apps-stored']),
		},
	);

	const instance = useQuery(
		['marketplace', 'apps-instance', isAdminUser],
		async () => {
			const result = await AppClientOrchestratorInstance.getInstalledApps().then((result: App[]) =>
				result.map((current: App) => ({
					...current,
					installed: true,
				})),
			);
			return result;
		},
		{
			staleTime: Infinity,
			refetchOnMount: 'always',
			onSettled: () => queryClient.invalidateQueries(['marketplace', 'apps-stored']),
		},
	);

	const { isLoading: isMarketplaceDataLoading, data: marketplaceData } = useQuery(
		['marketplace', 'apps-stored', instance.data, marketplace.data],
		() => storeQueryFunction(marketplace, instance),
		{
			enabled: marketplace.isFetched && instance.isFetched,
			keepPreviousData: true,
		},
	);

	const [marketplaceAppsData, installedAppsData, privateAppsData] = marketplaceData || [];

	return (
		<AppsContext.Provider
			children={children}
			value={{
				installedApps: getAppState(isMarketplaceDataLoading, installedAppsData),
				marketplaceApps: getAppState(
					isMarketplaceDataLoading,
					marketplaceAppsData,
					marketplace.error instanceof Error ? marketplace.error : undefined,
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

export default AppsProvider;
