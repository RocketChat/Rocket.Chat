import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { usePermission, useSingleStream } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { FC } from 'react';
import React, { useEffect } from 'react';

import { AppClientOrchestratorInstance } from '../../ee/client/apps/orchestrator';
import { AppsContext } from '../contexts/AppsContext';
import { useIsEnterprise } from '../hooks/useIsEnterprise';
import { useInvalidateLicense } from '../hooks/useLicense';
import { AsyncStatePhase } from '../lib/asyncState';
import { useInvalidateAppsCountQueryCallback } from '../views/marketplace/hooks/useAppsCountQuery';
import type { App } from '../views/marketplace/types';

const sortByName = (apps: App[]): App[] => apps.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));

const AppsProvider: FC = ({ children }) => {
	const isAdminUser = usePermission('manage-apps');

	const queryClient = useQueryClient();

	const { data } = useIsEnterprise();
	const isEnterprise = !!data?.isEnterprise;

	const invalidateAppsCountQuery = useInvalidateAppsCountQueryCallback();
	const invalidateLicenseQuery = useInvalidateLicense();

	const stream = useSingleStream('apps');

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
		() => {
			const result = AppClientOrchestratorInstance.getAppsFromMarketplace(isAdminUser);
			queryClient.invalidateQueries(['marketplace', 'apps-stored']);
			return result;
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
			onSettled: () => queryClient.invalidateQueries(['marketplace', 'apps-stored']),
		},
	);

	const store = useQuery(
		['marketplace', 'apps-stored', instance.data, marketplace.data],
		() => {
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
						installed: true,
						status: installedApp.status,
						version: installedApp.version,
						licenseValidation: installedApp.licenseValidation,
						migrated: installedApp.migrated,
					}),
					bundledIn: app.bundledIn,
					marketplaceVersion: app.version,
				};

				if (installedApp) {
					installedApps.push(record);
				}

				marketplaceApps.push(record);
			});

			sortByName(clonedData).forEach((app) => {
				if (app.private) {
					privateApps.push(app);
				}
			});

			return [marketplaceApps, installedApps, privateApps];
		},
		{
			enabled: marketplace.isFetched && instance.isFetched,
			keepPreviousData: true,
		},
	);

	return (
		<AppsContext.Provider
			children={children}
			value={{
				installedApps: { phase: AsyncStatePhase.RESOLVED, value: { apps: store.data?.[1] || [] } },
				marketplaceApps: { phase: AsyncStatePhase.RESOLVED, value: { apps: store.data?.[0] || [] } },
				privateApps: { phase: AsyncStatePhase.RESOLVED, value: { apps: store.data?.[2] || [] } },
				reload: async () => {
					await Promise.all([queryClient.invalidateQueries(['marketplace'])]);
				},
			}}
		/>
	);
};
export default AppsProvider;
