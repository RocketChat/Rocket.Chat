import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useInvalidateLicense, useLicense } from '@rocket.chat/ui-client';
import { usePermission, useStream } from '@rocket.chat/ui-contexts';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useContext, useEffect } from 'react';

import { useInvalidateAppsCountQueryCallback } from './useAppsCountQuery';
import { AppsContext } from '../../../contexts/AppsContext';
import { marketplaceQueryKeys } from '../../../lib/queryKeys';
import type { App } from '../types';

const sortByName = (apps: App[]): App[] => apps.toSorted((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));

/**
 * Aggregates result data from marketplace request and instance installed into their appropriate lists
 *
 * Exporting for better testing
 */
export const storeQueryFunction = (
	marketplace: UseQueryResult<App[], unknown>,
	instance: UseQueryResult<App[], unknown>,
): [App[], App[], App[]] => {
	if (!marketplace.isFetched && !instance.isFetched) {
		throw new Error('Apps not loaded');
	}

	const marketplaceApps: App[] = [];
	const installedApps: App[] = [];
	const privateApps: App[] = [];
	const clonedData = [...(instance.data || [])];

	sortByName(marketplace.data || []).forEach((app) => {
		const appIndex = clonedData.findIndex(({ id }) => id === app.id);
		const [installedApp] = appIndex > -1 ? clonedData.splice(appIndex, 1) : [];

		const record = {
			...app,
			...(installedApp && {
				private: installedApp.private,
				clusterStatus: installedApp.clusterStatus,
				installed: true,
				status: installedApp.status,
				version: installedApp.version,
				licenseValidation: installedApp.licenseValidation,
				migrated: installedApp.migrated,
				installedAddon: installedApp.addon,
			}),
			bundledIn: app.bundledIn,
			marketplaceVersion: app.version,
		};

		if (installedApp) {
			if (installedApp.private) {
				privateApps.push(record);
			} else {
				installedApps.push(record);
			}
		}

		marketplaceApps.push(record);
	});

	sortByName(clonedData).forEach((app) => {
		if (app.private) {
			privateApps.push(app);
			return;
		}

		installedApps.push(app);
	});

	return [marketplaceApps, installedApps, privateApps];
};

export const useApps = <
	TData = {
		installedApps: App[];
		marketplaceApps: App[];
		privateApps: App[];
	},
>(
	options?: Omit<
		UseQueryOptions<
			{
				installedApps: App[];
				marketplaceApps: App[];
				privateApps: App[];
			},
			Error,
			TData,
			ReturnType<typeof marketplaceQueryKeys.appsStored>
		>,
		'queryKey' | 'queryFn' | 'enabled' | 'placeholderData'
	>,
) => {
	const orchestrator = useContext(AppsContext);

	if (!orchestrator) throw new Error('Apps Orchestrator is not available');

	const canManageApps = usePermission('manage-apps');

	const queryClient = useQueryClient();

	const { isPending: isLicenseInformationLoading, data: { license } = {} } = useLicense({ loadValues: true });
	const isEnterprise = isLicenseInformationLoading ? undefined : !!license;

	const invalidateAppsCountQuery = useInvalidateAppsCountQueryCallback();
	const invalidateLicenseQuery = useInvalidateLicense();

	const stream = useStream('apps');

	const invalidate = useDebouncedCallback(
		() => {
			queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.appsInstance() });
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

	const marketplace = useQuery({
		queryKey: marketplaceQueryKeys.appsMarketplace(canManageApps),
		queryFn: async () => {
			const result = await orchestrator.getAppsFromMarketplace(canManageApps);
			if (result.error && typeof result.error === 'string') {
				throw new Error(result.error);
			}
			return result.apps;
		},
		staleTime: Infinity,
		placeholderData: keepPreviousData,
	});

	const instance = useQuery({
		queryKey: marketplaceQueryKeys.appsInstance(canManageApps),
		queryFn: async () => {
			const result = await orchestrator.getInstalledApps().then((result: App[]) =>
				result.map((current: App) => ({
					...current,
					installed: true,
				})),
			);
			return result;
		},
		staleTime: Infinity,
		refetchOnMount: 'always',
	});

	return useQuery({
		queryKey: marketplaceQueryKeys.appsStored(instance.data, marketplace.data),
		queryFn: async () => {
			if (marketplace.isError) {
				throw marketplace.error;
			}

			const [marketplaceAppsData, installedAppsData, privateAppsData] = storeQueryFunction(marketplace, instance);

			return {
				installedApps: installedAppsData,
				marketplaceApps: marketplaceAppsData,
				privateApps: privateAppsData,
			};
		},
		enabled: marketplace.isFetched && instance.isFetched,
		placeholderData: keepPreviousData,
		...options,
	});
};
