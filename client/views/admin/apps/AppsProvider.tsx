import React, {
	useEffect,
	useRef,
	useState,
	FC,
} from 'react';

import { Apps } from '../../../../app/apps/client/orchestrator';
import { AppEvents } from '../../../../app/apps/client/communication';
import { handleAPIError } from './helpers';
import { App } from './types';
import { AppsContext } from './AppsContext';

type ListenersMapping = {
	readonly [P in keyof typeof AppEvents]?: (...args: any[]) => void;
};

const registerListeners = (listeners: ListenersMapping): (() => void) => {
	const entries = Object.entries(listeners) as Exclude<{
		[K in keyof ListenersMapping]: [K, ListenersMapping[K]];
	}[keyof ListenersMapping], undefined>[];

	for (const [event, callback] of entries) {
		Apps.getWsListener()?.registerListener(AppEvents[event], callback);
	}

	return (): void => {
		for (const [event, callback] of entries) {
			Apps.getWsListener()?.unregisterListener(AppEvents[event], callback);
		}
	};
};

const AppsProvider: FC = ({ children }) => {
	const [apps, setApps] = useState<App[]>(() => []);
	const [finishedLoading, setFinishedLoading] = useState<boolean>(() => false);

	const ref = useRef(apps);
	ref.current = apps;

	const invalidateData = (): void => {
		setApps((apps) => [...apps]);
	};

	const getDataCopy = (): typeof ref.current => ref.current.slice(0);

	useEffect(() => {
		const updateData = (data: App[]): void => {
			setApps(data.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1)));
			invalidateData();
		};

		const handleAppAddedOrUpdated = async (appId: string): Promise<void> => {
			try {
				const { status, version } = await Apps.getApp(appId);
				const app = await Apps.getAppFromMarketplace(appId, version);
				const updatedData = getDataCopy();
				const index = updatedData.findIndex(({ id }: {id: string}) => id === appId);
				updatedData[index] = {
					...app,
					installed: true,
					status,
					version,
					marketplaceVersion: app.version,
				};
				setApps(updatedData);
				invalidateData();
			} catch (error) {
				handleAPIError(error);
			}
		};

		const listeners = {
			APP_ADDED: handleAppAddedOrUpdated,
			APP_UPDATED: handleAppAddedOrUpdated,
			APP_REMOVED: (appId: string): void => {
				const updatedData = getDataCopy();
				const index = updatedData.findIndex(({ id }: {id: string}) => id === appId);
				if (!updatedData[index]) {
					return;
				}

				if (updatedData[index].marketplace !== false) {
					updatedData.splice(index, 1);
				} else {
					delete updatedData[index].installed;
					delete updatedData[index].status;
					updatedData[index].version = updatedData[index].marketplaceVersion;
				}

				setApps(updatedData);
				invalidateData();
			},
			APP_STATUS_CHANGE: ({ appId, status }: {appId: string; status: unknown}): void => {
				const updatedData = getDataCopy();
				const app = updatedData.find(({ id }: {id: string}) => id === appId);

				if (!app) {
					return;
				}
				app.status = status;
				setApps(updatedData);
				invalidateData();
			},
			APP_SETTING_UPDATED: (): void => {
				invalidateData();
			},
		};

		const unregisterListeners = registerListeners(listeners);

		const fetchData = async (): Promise<void> => {
			try {
				const installedApps = await Apps.getApps().then((result) => {
					let apps: App[] = [];
					if (result.length) {
						apps = result.map((current: App) => ({ ...current, installed: true, marketplace: false }));
						updateData(apps);
					}
					return apps;
				}) as App[];

				const marketplaceApps = await Apps.getAppsFromMarketplace() as App[];

				const appsData = marketplaceApps.length ? marketplaceApps.map<App>((app) => {
					const appIndex = installedApps.findIndex(({ id }) => id === app.id);
					if (!installedApps[appIndex]) {
						return {
							...app,
							status: undefined,
							marketplaceVersion: app.version,
							bundledIn: app.bundledIn,
						};
					}

					const installedApp = installedApps.splice(appIndex, 1).pop();
					return {
						...app,
						installed: true,
						...installedApp && {
							status: installedApp.status,
							version: installedApp.version,
						},
						bundledIn: app.bundledIn,
						marketplaceVersion: app.version,
					};
				}) : [];

				if (installedApps.length) {
					appsData.push(...installedApps);
				}

				updateData(appsData);
				setFinishedLoading(true);
			} catch (e) {
				handleAPIError(e);
				unregisterListeners();
			}
		};

		fetchData();

		return unregisterListeners;
	}, []);

	const value = {
		apps,
		finishedLoading,
	};

	return <AppsContext.Provider children={children} value={value} />;
};

export default AppsProvider;
