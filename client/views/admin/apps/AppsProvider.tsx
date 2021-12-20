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
	| { type: 'request' }
	| { type: 'update'; app: App }
	| { type: 'delete'; appId: string }
	| { type: 'invalidate'; appId: string }
	| { type: 'success'; apps: App[] }
	| { type: 'failure'; error: Error };

const AppsProvider: FC = ({ children }) => {
	const sortByName = (apps: App[]): App[] =>
	apps.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));

	const reducer = (
		state: AsyncState<{ apps: App[] }>,
		action: Action,
	): AsyncState<{ apps: App[] }> => {
		switch (action.type) {
			case 'invalidate':
				if (state.phase !== AsyncStatePhase.RESOLVED) {
					return state;
				}
				return {
					phase: AsyncStatePhase.RESOLVED,
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
					phase: AsyncStatePhase.LOADING,
					value: undefined,
					error: undefined,
				};
			case 'success':
				return {
					phase: AsyncStatePhase.RESOLVED,
					value: { apps: sortByName(action.apps) },
					error: undefined,
				};
			case 'failure':
				return {
					phase: AsyncStatePhase.REJECTED,
					value: undefined,
					error: action.error,
					reset: () => fetchApps(),
				};
			default:
				return state;
		}
	};

	const [state, dispatch] = useReducer<Reducer<AsyncState<{ apps: App[] }>, Action>>(reducer, {
		phase: AsyncStatePhase.LOADING,
		value: undefined,
		error: undefined,
	});

	const ref = useRef<App[]>([]);

	const getDataCopy = (): typeof ref.current => ref.current.slice(0);

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
			dispatch({ type: 'update', app: record });
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
				return dispatch({ type: 'delete', appId });
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { installed, status, marketplaceVersion, ...record } = updatedData[index];

			return dispatch({
				type: 'update',
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
			});
		},
		APP_SETTING_UPDATED: ({ appId }: { appId: string }): void => {
			dispatch({ type: 'invalidate', appId });
		},
	};

	const unregisterListeners = registerListeners(listeners);

	const fetchApps = useCallback(
		async (): Promise<void> => {
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
				});
			} catch (e) {
				dispatch({
					type: 'failure',
					error: e,
				});
				unregisterListeners();
			}
		},
		[unregisterListeners, listeners, handleAppAddedOrUpdated, getDataCopy, ref, dispatch, reducer, sortByName],
	)

	useEffect(() => {
		fetchApps();

		return unregisterListeners;
	}, []);

	return <AppsContext.Provider children={children} value={state} />;
};

export default AppsProvider;
