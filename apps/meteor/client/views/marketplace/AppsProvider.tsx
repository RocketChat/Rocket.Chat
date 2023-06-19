import { usePermission } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { FC } from 'react';
import React, { useEffect } from 'react';

import { AppEvents } from '../../../ee/client/apps/communication';
import { Apps } from '../../../ee/client/apps/orchestrator';
import PageSkeleton from '../../components/PageSkeleton';
import { AsyncStatePhase } from '../../lib/asyncState';
import { AppsContext } from './AppsContext';
import { useInvalidateAppsCountQueryCallback } from './hooks/useAppsCountQuery';
import type { App } from './types';

type ListenersMapping = {
	readonly [P in keyof typeof AppEvents]?: (...args: any[]) => void;
};

const registerListeners = (listeners: ListenersMapping): (() => void) => {
	const entries = Object.entries(listeners) as Exclude<
		{
			[K in keyof ListenersMapping]: [K, ListenersMapping[K]];
		}[keyof ListenersMapping],
		undefined
	>[];
	for (const [event, callback] of entries) {
		Apps.getWsListener()?.registerListener(AppEvents[event], callback);
	}
	return (): void => {
		for (const [event, callback] of entries) {
			Apps.getWsListener()?.unregisterListener(AppEvents[event], callback);
		}
	};
};

const sortByName = (apps: App[]): App[] => apps.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));

const AppsProvider: FC = ({ children }) => {
	const isAdminUser = usePermission('manage-apps');

	const queryClient = useQueryClient();

	const invalidateAppsCountQuery = useInvalidateAppsCountQueryCallback();

	useEffect(() => {
		const listeners = {
			APP_ADDED: (): void => {
				queryClient.invalidateQueries(['marketplace', 'apps-instance']);
			},
			APP_UPDATED: (): void => {
				queryClient.invalidateQueries(['marketplace', 'apps-instance']);
			},
			APP_REMOVED: (): void => {
				queryClient.invalidateQueries(['marketplace', 'apps-instance']);
			},
			APP_STATUS_CHANGE: (): void => {
				queryClient.invalidateQueries(['marketplace', 'apps-instance']);
			},
			APP_SETTING_UPDATED: (): void => {
				queryClient.invalidateQueries(['marketplace', 'apps-instance']);
			},
		};
		const unregisterListeners = registerListeners(listeners);

		// eslint-disable-next-line no-unsafe-finally
		return unregisterListeners;
	}, [invalidateAppsCountQuery, isAdminUser, queryClient]);

	const marketplace = useQuery(
		['marketplace', 'apps-marketplace', isAdminUser],
		() => {
			const result = Apps.getAppsFromMarketplace(isAdminUser ? 'true' : 'false');
			queryClient.invalidateQueries(['marketplace', 'apps-stored']);
			return result;
		},
		{
			staleTime: Infinity,
			refetchOnWindowFocus: false,
			keepPreviousData: true,
			onSettled: () => queryClient.invalidateQueries(['marketplace', 'apps-stored']),
		},
	);

	const instance = useQuery(
		['marketplace', 'apps-instance', isAdminUser],
		async () => {
			const result = await Apps.getInstalledApps().then((result: App[]) =>
				result.map((current: App) => ({
					...current,
					installed: true,
				})),
			);
			return result;
		},
		{
			staleTime: Infinity,
			refetchOnWindowFocus: false,
			keepPreviousData: true,
			onSettled: () => queryClient.invalidateQueries(['marketplace', 'apps-stored']),
		},
	);

	const store = useQuery(
		['marketplace', 'apps-stored', isAdminUser],
		() => {
			if (!marketplace.isSuccess || !instance.isSuccess) {
				throw new Error('Apps not loaded');
			}

			const marketplaceApps: App[] = [];
			const installedApps: App[] = [];
			const privateApps: App[] = [];

			const clonedData = [...instance.data];

			sortByName(marketplace.data).forEach((app) => {
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

				if (installedApp?.private) {
					privateApps.push(record);
				}

				if (installedApp && !installedApp.private) {
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
			enabled: marketplace.isSuccess && instance.isSuccess && !instance.isRefetching,
			refetchOnWindowFocus: false,
			keepPreviousData: true,
		},
	);

	if (!store.isSuccess) {
		return <PageSkeleton />;
	}

	return (
		<AppsContext.Provider
			children={children}
			value={{
				installedApps: { phase: AsyncStatePhase.RESOLVED, value: { apps: store.data[1] } },
				marketplaceApps: { phase: AsyncStatePhase.RESOLVED, value: { apps: store.data[0] } },
				privateApps: { phase: AsyncStatePhase.RESOLVED, value: { apps: store.data[2] } },
				reload: async () => {
					await Promise.all([queryClient.invalidateQueries(['marketplace'])]);
				},
			}}
		/>
	);
};
export default AppsProvider;
