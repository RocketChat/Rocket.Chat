import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { FC } from 'react';
import React, { useEffect } from 'react';

import PageSkeleton from '../../components/PageSkeleton';
import { AppEvents } from '../../../ee/client/apps/communication';
import { Apps } from '../../../ee/client/apps/orchestrator';
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
				queryClient.invalidateQueries(['apps-instance', isAdminUser]);
				queryClient.invalidateQueries(['apps-stored', isAdminUser]);
			},
			APP_UPDATED: (): void => {
				queryClient.invalidateQueries(['apps-instance', isAdminUser]);
				queryClient.invalidateQueries(['apps-stored', isAdminUser]);
			},
			APP_REMOVED: (appId: string): void => {
				queryClient.setQueryData<App[]>(['apps-instance', isAdminUser], (data) => {
					return data?.filter((app) => app.id !== appId);
				});
				queryClient.invalidateQueries(['apps-stored', isAdminUser]);
			},
			APP_STATUS_CHANGE: ({ appId, status }: { appId: string; status: AppStatus }): void => {
				queryClient.setQueryData<App[]>(['apps-instance', isAdminUser], (data) => {
					return data?.map((app) => {
						if (app.id !== appId) {
							return app;
						}
						return {
							...app,
							status,
						};
					});
				});
				queryClient.invalidateQueries(['apps-stored', isAdminUser]);
			},
			APP_SETTING_UPDATED: (): void => {
				queryClient.invalidateQueries(['apps-instance', isAdminUser]);
				queryClient.invalidateQueries(['apps-stored', isAdminUser]);
			},
		};
		const unregisterListeners = registerListeners(listeners);

		// eslint-disable-next-line no-unsafe-finally
		return unregisterListeners;
	}, [invalidateAppsCountQuery, isAdminUser, queryClient]);

	const marketplace = useQuery(['apps-marketplace', isAdminUser], () => Apps.getAppsFromMarketplace(isAdminUser ? 'true' : 'false'));

	const instance = useQuery(['apps-instance', isAdminUser], () =>
		Apps.getInstalledApps().then((result: App[]) =>
			result.map((current: App) => ({
				...current,
				installed: true,
			})),
		),
	);

	const store = useQuery(
		['apps-stored', isAdminUser],
		() => {
			if (!marketplace.isSuccess || !instance.isSuccess) {
				throw new Error('Apps not loaded');
			}

			const marketplaceApps: App[] = [];
			const installedApps: App[] = [];
			const privateApps: App[] = [];

			sortByName(marketplace.data).forEach((app) => {
				const appIndex = instance.data.findIndex(({ id }) => id === app.id);
				const [installedApp] = appIndex > -1 ? instance.data.splice(appIndex, 1) : [];

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

			sortByName(instance.data).forEach((app) => {
				if (app.private) {
					privateApps.push(app);
				}
			});

			return [marketplaceApps, installedApps, privateApps];
		},
		{
			enabled: marketplace.isSuccess && instance.isSuccess,
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
					await Promise.all([
						queryClient.invalidateQueries(['apps-marketplace', isAdminUser]),
						queryClient.invalidateQueries(['apps-instance', isAdminUser]),
					]);
				},
			}}
		/>
	);
};
export default AppsProvider;
