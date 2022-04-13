import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useEffect, FC, useReducer, Reducer, useCallback } from 'react';

import { AppEvents } from '../../../../app/apps/client/communication';
import { Apps } from '../../../../app/apps/client/orchestrator';
import { AsyncState, AsyncStatePhase } from '../../../lib/asyncState';
import { AppsContext } from './AppsContext';
import { handleAPIError } from './helpers';
import { App } from './types';

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

type Action =
	| { type: 'request'; reload: () => Promise<void> }
	| { type: 'update'; app: App; reload: () => Promise<void> }
	| { type: 'delete'; appId: string; reload: () => Promise<void> }
	| { type: 'invalidate'; appId: string; reload: () => Promise<void> }
	| { type: 'success'; apps: App[]; reload: () => Promise<void> }
	| { type: 'failure'; error: Error; reload: () => Promise<void> };

const sortByName = (apps: App[]): App[] => apps.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));

const reducer = (
	state: AsyncState<{ apps: App[] }> & {
		reload: () => Promise<void>;
	},
	action: Action,
): AsyncState<{ apps: App[] }> & {
	reload: () => Promise<void>;
} => {
	switch (action.type) {
		case 'invalidate':
			if (state.phase !== AsyncStatePhase.RESOLVED) {
				return state;
			}
			return {
				phase: AsyncStatePhase.RESOLVED,
				reload: action.reload,
				value: {
					apps: sortByName(
						state.value.apps.map((app) => {
							if (app.id === action.appId) {
								return { ...app };
							}
							return app;
						}),
					),
				},
				error: undefined,
			};
		case 'update':
			if (state.phase !== AsyncStatePhase.RESOLVED) {
				return state;
			}
			return {
				phase: AsyncStatePhase.RESOLVED,
				reload: async (): Promise<void> => undefined,
				value: {
					apps: sortByName(
						state.value.apps.map((app) => {
							if (app.id === action.app.id) {
								return action.app;
							}
							return app;
						}),
					),
				},
				error: undefined,
			};
		case 'request':
			return {
				reload: async (): Promise<void> => undefined,
				phase: AsyncStatePhase.LOADING,
				value: undefined,
				error: undefined,
			};
		case 'success':
			return {
				reload: action.reload,
				phase: AsyncStatePhase.RESOLVED,
				value: { apps: sortByName(action.apps) },
				error: undefined,
			};
		case 'delete':
			if (state.phase !== AsyncStatePhase.RESOLVED) {
				return state;
			}
			return {
				reload: action.reload,
				phase: AsyncStatePhase.RESOLVED,
				value: { apps: state.value.apps.filter(({ id }) => id !== action.appId) },
				error: undefined,
			};
		case 'failure':
			return {
				reload: action.reload,
				phase: AsyncStatePhase.REJECTED,
				value: undefined,
				error: action.error,
			};
		default:
			return state;
	}
};

const AppsProvider: FC = ({ children }) => {
	const [marketplaceAppsState, dispatchMarketplaceApps] = useReducer<
		Reducer<
			AsyncState<{ apps: App[] }> & {
				reload: () => Promise<void>;
			},
			Action
		>
	>(reducer, {
		phase: AsyncStatePhase.LOADING,
		value: undefined,
		error: undefined,
		reload: async () => undefined,
	});

	const [installedAppsState, dispatchInstalledApps] = useReducer<
		Reducer<
			AsyncState<{ apps: App[] }> & {
				reload: () => Promise<void>;
			},
			Action
		>
	>(reducer, {
		phase: AsyncStatePhase.LOADING,
		value: undefined,
		error: undefined,
		reload: async () => undefined,
	});

	const fetch = useCallback(async (): Promise<void> => {
		dispatchMarketplaceApps({ type: 'request', reload: async () => undefined });
		dispatchInstalledApps({ type: 'request', reload: async () => undefined });

		let installedApps: App[] = [];
		let marketplaceApps: App[] = [];
		let marketplaceError = false;
		let installedAppsError = false;

		try {
			marketplaceApps = (await Apps.getAppsFromMarketplace()) as App[];
		} catch (e) {
			dispatchMarketplaceApps({
				type: 'failure',
				error: e,
				reload: fetch,
			});
			marketplaceError = true;
		}

		try {
			installedApps = await Apps.getApps().then((result: App[]) =>
				result.map((current: App) => ({
					...current,
					installed: true,
					marketplace: false,
				})),
			);
		} catch (e) {
			dispatchInstalledApps({
				type: 'failure',
				error: e,
				reload: fetch,
			});
			installedAppsError = true;
		}

		const installedAppsData: App[] = [];
		const marketplaceAppsData: App[] = [];

		if (!marketplaceError) {
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
				};

				installedAppsData.push(appData);
				marketplaceAppsData.push(appData);
			});
			dispatchMarketplaceApps({
				type: 'success',
				reload: fetch,
				apps: marketplaceAppsData,
			});
		}

		if (!installedAppsError) {
			if (installedApps.length) {
				installedAppsData.push(...installedApps);
			}

			dispatchInstalledApps({
				type: 'success',
				reload: fetch,
				apps: installedAppsData,
			});
		}
	}, []);

	const getCurrentData = useMutableCallback(function getCurrentData() {
		return [marketplaceAppsState, installedAppsState];
	});

	useEffect(() => {
		const handleAppAddedOrUpdated = async (appId: string): Promise<void> => {
			let marketplaceApp: App | undefined;
			let installedApp: App;

			try {
				installedApp = await Apps.getApp(appId);
			} catch (error) {
				handleAPIError(error);
				throw error;
			}

			try {
				marketplaceApp = await Apps.getAppFromMarketplace(appId, installedApp.version);
			} catch (error) {
				handleAPIError(error);
			}

			if (marketplaceApp !== undefined) {
				const { status, version, licenseValidation } = installedApp;
				const record = {
					...marketplaceApp,
					installed: true,
					status,
					version,
					licenseValidation,
					marketplaceVersion: marketplaceApp.version,
				};

				const [, installedApps] = getCurrentData();

				dispatchMarketplaceApps({
					type: 'update',
					app: record,
					reload: fetch,
				});

				if (installedApps.value) {
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

			dispatchInstalledApps({ type: 'update', app: installedApp, reload: fetch });
		};
		const listeners = {
			APP_ADDED: handleAppAddedOrUpdated,
			APP_UPDATED: handleAppAddedOrUpdated,
			APP_REMOVED: (appId: string): void => {
				const [updatedData] = getCurrentData();
				const app = updatedData.value?.apps.find(({ id }: { id: string }) => id === appId);

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
			},
			APP_STATUS_CHANGE: ({ appId, status }: { appId: string; status: AppStatus }): void => {
				const [updatedData] = getCurrentData();
				const app = updatedData.value?.apps.find(({ id }: { id: string }) => id === appId);
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
			},
			APP_SETTING_UPDATED: ({ appId }: { appId: string }): void => {
				dispatchInstalledApps({ type: 'invalidate', appId, reload: fetch });
				dispatchMarketplaceApps({ type: 'invalidate', appId, reload: fetch });
			},
		};
		const unregisterListeners = registerListeners(listeners);
		try {
			fetch();
		} finally {
			// eslint-disable-next-line no-unsafe-finally
			return unregisterListeners;
		}
	}, [fetch, getCurrentData]);
	return (
		<AppsContext.Provider
			children={children}
			value={{ installedApps: installedAppsState, marketplaceApps: marketplaceAppsState, reload: fetch }}
		/>
	);
};
export default AppsProvider;
