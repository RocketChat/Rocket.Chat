import React, {
	createContext,
	useEffect,
	useRef,
	useState,
	FunctionComponent,
} from 'react';

import { Apps } from '../../../app/apps/client/orchestrator';
import { AppEvents } from '../../../app/apps/client/communication';
import { handleAPIError } from './helpers';

type App = {
	id: string;
	name: string;
	status: unknown;
	installed: boolean;
	marketplace: unknown;
	version: unknown;
	marketplaceVersion: unknown;
	bundledIn: unknown;
};

export type AppDataContextValue = {
	data: App[];
	dataCache: any;
}

export const AppDataContext = createContext<AppDataContextValue>({
	data: [],
	dataCache: [],
});

type ListenersMapping = {
	readonly [P in keyof typeof AppEvents]?: (...args: any[]) => void;
};

const registerListeners = (listeners: ListenersMapping): (() => void) => {
	const entries = Object.entries(listeners) as [keyof typeof AppEvents, () => void][];

	for (const [event, callback] of entries) {
		Apps.getWsListener()?.registerListener(AppEvents[event], callback);
	}

	return (): void => {
		for (const [event, callback] of entries) {
			Apps.getWsListener()?.unregisterListener(AppEvents[event], callback);
		}
	};
};

const AppProvider: FunctionComponent = ({ children }) => {
	const [data, setData] = useState<App[]>(() => []);
	const [dataCache, setDataCache] = useState<any>(() => []);

	const ref = useRef(data);
	ref.current = data;

	const invalidateData = (): void => {
		setDataCache(() => []);
	};

	const getDataCopy = (): typeof ref.current => ref.current.slice(0);

	useEffect(() => {
		const handleAppAddedOrUpdated = async (appId: string): Promise<void> => {
			try {
				const { status, version } = await Apps.getApp(appId);
				const app = await Apps.getAppFromMarketplace(appId, version);
				const updatedData = getDataCopy();
				const index = updatedData.findIndex(({ id }) => id === appId);
				updatedData[index] = {
					...app,
					installed: true,
					status,
					version,
					marketplaceVersion: app.version,
				};
				setData(updatedData);
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
				const index = updatedData.findIndex(({ id }) => id === appId);
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

				setData(updatedData);
				invalidateData();
			},
			APP_STATUS_CHANGE: ({ appId, status }: {appId: string; status: unknown}): void => {
				const updatedData = getDataCopy();
				const app = updatedData.find(({ id }) => id === appId);

				if (!app) {
					return;
				}
				app.status = status;
				setData(updatedData);
				invalidateData();
			},
			APP_SETTING_UPDATED: (): void => {
				invalidateData();
			},
		};

		const unregisterListeners = registerListeners(listeners);

		(async (): Promise<void> => {
			try {
				const [marketplaceApps, installedApps] = await Promise.all([
					Apps.getAppsFromMarketplace() as Promise<App[]>,
					Apps.getApps() as Promise<App[]>,
				]);
				const appsData = marketplaceApps.map((app) => {
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
						status: installedApp?.status,
						version: installedApp?.version,
						bundledIn: app.bundledIn,
						marketplaceVersion: app.version,
					};
				});

				if (installedApps.length) {
					appsData.push(...installedApps.map((current) => ({ ...current, installed: true, marketplace: false })));
				}

				setData(appsData.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1)));
				invalidateData();
			} catch (e) {
				handleAPIError(e);
				unregisterListeners();
			}
		})();

		return unregisterListeners;
	}, []);

	return <AppDataContext.Provider children={children} value={{ data, dataCache }} />;
};

export default AppProvider;
