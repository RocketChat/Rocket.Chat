import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import React, { useEffect, useRef, FC, useReducer, Reducer, useCallback } from 'react';

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
	const [state, dispatch] = useReducer<
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
		dispatch({ type: 'request', reload: async () => undefined });
		try {
			const installedApps = await Apps.getApps().then((result: App[]) =>
				result.map((current: App) => ({
					...current,
					installed: true,
					marketplace: false,
				})),
			);
			const marketplaceApps = (await Apps.getAppsFromMarketplace()) as App[];
			const appsData = marketplaceApps.map<App>((app) => {
				const appIndex = installedApps.findIndex(({ id }) => id === app.id);
				if (!installedApps[appIndex]) {
					return {
						...app,
						status: undefined,
						marketplaceVersion: app.version,
						bundledIn: app.bundledIn,
					};
				}
				const [installedApp] = installedApps.splice(appIndex, 1);
				return {
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
			});
			if (installedApps.length) {
				appsData.push(...installedApps);
			}
			dispatch({
				type: 'success',
				apps: appsData,
				reload: fetch,
			});
		} catch (e) {
			dispatch({
				type: 'failure',
				error: e,
				reload: fetch,
			});
			throw e;
		}
	}, []);
	const ref = useRef<App[]>([]);
	const getDataCopy = (): typeof ref.current => ref.current.slice(0);
	useEffect(() => {
		const handleAppAddedOrUpdated = async (appId: string): Promise<void> => {
			try {
				const { status, version, licenseValidation } = await Apps.getApp(appId);
				const app = await Apps.getAppFromMarketplace(appId, version);
				const record = {
					...app,
					installed: true,
					status,
					version,
					licenseValidation,
					marketplaceVersion: app.version,
				};
				dispatch({ type: 'update', app: record, reload: fetch });
			} catch (error) {
				handleAPIError(error);
			}
		};
		const listeners = {
			APP_ADDED: handleAppAddedOrUpdated,
			APP_UPDATED: handleAppAddedOrUpdated,
			APP_REMOVED: (appId: string): void => {
				const updatedData = getDataCopy();
				const index = updatedData.findIndex(({ id }: { id: string }) => id === appId);
				if (index < 0) {
					return;
				}
				if (updatedData[index].marketplace !== false) {
					return dispatch({ type: 'delete', appId, reload: fetch });
				}
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { installed, status, marketplaceVersion, ...record } = updatedData[index];
				return dispatch({
					type: 'update',
					reload: fetch,
					app: {
						...record,
						version: marketplaceVersion,
						marketplaceVersion,
					},
				});
			},
			APP_STATUS_CHANGE: ({ appId, status }: { appId: string; status: AppStatus }): void => {
				const updatedData = getDataCopy();
				const app = updatedData.find(({ id }: { id: string }) => id === appId);
				if (!app) {
					return;
				}
				app.status = status;
				return dispatch({
					type: 'update',
					app: {
						...app,
						status,
					},
					reload: fetch,
				});
			},
			APP_SETTING_UPDATED: ({ appId }: { appId: string }): void => {
				dispatch({ type: 'invalidate', appId, reload: fetch });
			},
		};
		const unregisterListeners = registerListeners(listeners);
		try {
			fetch();
		} finally {
			// eslint-disable-next-line no-unsafe-finally
			return unregisterListeners;
		}
	}, [fetch]);
	return <AppsContext.Provider children={children} value={state} />;
};
export default AppsProvider;
