import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { usePermission } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useEffect, useReducer, useCallback } from 'react';

import { AppClientOrchestratorInstance } from '../../../ee/client/apps/orchestrator';
import { AppsContext } from '../../contexts/AppsContext';
import { AsyncStatePhase } from '../../lib/asyncState';
import { handleAPIError } from '../../views/marketplace/helpers';
import { useInvalidateAppsCountQueryCallback } from '../../views/marketplace/hooks/useAppsCountQuery';
import type { App } from '../../views/marketplace/types';
import { appsReducer } from './appsReducer';
import { registerListeners } from './registerListeners';

const AppsProvider: FC = ({ children }) => {
	const isAdminUser = usePermission('manage-apps');
	const invalidateAppsCountQuery = useInvalidateAppsCountQueryCallback();

	const [marketplaceAppsState, dispatchMarketplaceApps] = useReducer(appsReducer, {
		phase: AsyncStatePhase.LOADING,
		value: undefined,
		error: undefined,
		reload: async () => undefined,
	});

	const [installedAppsState, dispatchInstalledApps] = useReducer(appsReducer, {
		phase: AsyncStatePhase.LOADING,
		value: undefined,
		error: undefined,
		reload: async () => undefined,
	});

	const getCurrentData = useMutableCallback(() => {
		return [marketplaceAppsState, installedAppsState];
	});

	const fetch = useCallback(async (): Promise<void> => {
		dispatchMarketplaceApps({ type: 'request' });
		dispatchInstalledApps({ type: 'request' });

		console.log('brah');

		let installedApps: App[] = [];
		let marketplaceApps: App[] = [];

		const installedAppsData: App[] = [];
		const marketplaceAppsData: App[] = [];

		try {
			marketplaceApps = (await AppClientOrchestratorInstance.getAppsFromMarketplace(isAdminUser)) as unknown as App[];

			marketplaceApps.forEach((app) => {
				const appIndex = installedApps.findIndex(({ id }) => id === app.id);
				if (!installedApps[appIndex]) {
					marketplaceAppsData.push({
						...app,
						status: undefined,
						marketplaceVersion: app.version,
						bundledIn: app.bundledIn,
					});

					return;
				}
				const [installedApp] = installedApps.splice(appIndex, 1);
				const appData = {
					...app,
					installed: true,
					...(installedApp && {
						status: installedApp.status,
						version: installedApp.version,
						licenseValidation: installedApp.licenseValidation,
					}),
					bundledIn: app.bundledIn,
					marketplaceVersion: app.version,
					migrated: installedApp.migrated,
				};

				installedAppsData.push(appData);
				marketplaceAppsData.push(appData);
			});
			dispatchMarketplaceApps({
				type: 'success',
				reload: fetch,
				apps: marketplaceAppsData,
			});
		} catch (e) {
			dispatchMarketplaceApps({
				type: 'failure',
				error: e instanceof Error ? e : new Error(String(e)),
				reload: fetch,
			});
		}

		try {
			installedApps = await AppClientOrchestratorInstance.getInstalledApps().then((result: App[]) =>
				result.map((current: App) => ({
					...current,
					installed: true,
				})),
			);

			if (installedApps.length > 0) {
				installedAppsData.push(...installedApps);
			}

			dispatchInstalledApps({
				type: 'success',
				reload: fetch,
				apps: installedAppsData,
			});
		} catch (e) {
			dispatchInstalledApps({
				type: 'failure',
				error: e instanceof Error ? e : new Error(String(e)),
				reload: fetch,
			});
		}
	}, [isAdminUser]);

	useEffect(() => {
		const handleAppAddedOrUpdated = async (appId: string): Promise<void> => {
			let marketplaceApp: { app: App; success: boolean } | undefined;
			let installedApp: App;

			invalidateAppsCountQuery();

			try {
				const app = await AppClientOrchestratorInstance.getApp(appId);

				installedApp = app;
			} catch (error: any) {
				handleAPIError(error);
				throw error;
			}

			try {
				marketplaceApp = await AppClientOrchestratorInstance.getAppFromMarketplace(appId, installedApp.version);
			} catch (error: any) {
				handleAPIError(error);
			}

			const [, installedApps] = getCurrentData();

			if (marketplaceApp !== undefined) {
				const { status, version, licenseValidation } = installedApp;
				const record = {
					...marketplaceApp.app,
					success: marketplaceApp.success,
					installed: true,
					status,
					version,
					licenseValidation,
					marketplaceVersion: marketplaceApp.app.version,
				};

				dispatchMarketplaceApps({
					type: 'update',
					app: record,
					reload: fetch,
				});

				if (installedApps.value) {
					if (installedApps.value.apps.some((app) => app.id === appId)) {
						dispatchInstalledApps({
							type: 'update',
							app: record,
							reload: fetch,
						});
						return;
					}
					dispatchInstalledApps({
						type: 'success',
						apps: [...installedApps.value.apps, record],
						reload: fetch,
					});
					return;
				}

				dispatchInstalledApps({
					type: 'success',
					apps: [record],
					reload: fetch,
				});

				return;
			}

			// TODO: Reevaluate the necessity of this dispatch
			dispatchInstalledApps({ type: 'update', app: installedApp, reload: fetch });
		};

		const handleAppRemoved = (appId: string): void => {
			const updatedData = getCurrentData();

			// TODO: This forEach is not ideal, it will be improved in the future during the refactor of this provider;
			updatedData.forEach((appsList) => {
				const app = appsList.value?.apps.find(({ id }: { id: string }) => id === appId);

				dispatchInstalledApps({
					type: 'delete',
					appId,
					reload: fetch,
				});

				if (!app) {
					return;
				}

				dispatchMarketplaceApps({
					type: 'update',
					reload: fetch,
					app: {
						...app,
						version: app?.marketplaceVersion,
						installed: false,
						marketplaceVersion: app?.marketplaceVersion,
					},
				});
			});

			invalidateAppsCountQuery();
		};

		const handleAppStatusChange = ({ appId, status }: { appId: string; status: AppStatus }): void => {
			const updatedData = getCurrentData();

			if (!Array.isArray(updatedData)) {
				return;
			}

			// TODO: This forEach is not ideal, it will be improved in the future during the refactor of this provider;
			updatedData.forEach((appsList) => {
				const app = appsList.value?.apps.find(({ id }: { id: string }) => id === appId);

				if (!app) {
					return;
				}

				app.status = status;

				dispatchInstalledApps({
					type: 'update',
					app: {
						...app,
						status,
					},
					reload: fetch,
				});

				dispatchMarketplaceApps({
					type: 'update',
					app: {
						...app,
						status,
					},
					reload: fetch,
				});
			});

			invalidateAppsCountQuery();
		};

		const handleAppSettingUpdated = ({ appId }: { appId: string }): void => {
			dispatchInstalledApps({ type: 'invalidate', appId, reload: fetch });
			dispatchMarketplaceApps({ type: 'invalidate', appId, reload: fetch });
		};

		fetch();

		return registerListeners({
			APP_ADDED: handleAppAddedOrUpdated,
			APP_UPDATED: handleAppAddedOrUpdated,
			APP_REMOVED: handleAppRemoved,
			APP_STATUS_CHANGE: handleAppStatusChange,
			APP_SETTING_UPDATED: handleAppSettingUpdated,
		});
	}, [fetch, getCurrentData, invalidateAppsCountQuery]);

	return (
		<AppsContext.Provider
			children={children}
			value={{
				installedApps: installedAppsState,
				marketplaceApps: marketplaceAppsState,
				reload: fetch,
			}}
		/>
	);
};
export default AppsProvider;
