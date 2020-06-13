import { useRef, useState, useEffect } from 'react';

import { Apps } from '../../../../app/apps/client/orchestrator';
import { AppEvents } from '../../../../app/apps/client/communication';
import { handleAPIError } from '../helpers';

const registerListeners = (listeners) => {
	Object.entries(listeners).forEach(([event, callback]) => {
		Apps.getWsListener().registerListener(AppEvents[event], callback);
	});
	return () => {
		Object.entries(listeners).forEach(([event, callback]) => {
			Apps.getWsListener().unregisterListener(AppEvents[event], callback);
		});
	};
};

export function useAppsData() {
	const [data, setData] = useState({});

	const [dataCache, setDataCache] = useState();

	const ref = useRef();
	ref.current = data;

	const invalidateData = () => setDataCache(new Date());

	const getDataCopy = () => ref.current.slice(0);

	const handleAppAddedOrUpdated = async (appId) => {
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
		APP_REMOVED: (appId) => {
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
		APP_STATUS_CHANGE: ({ appId, status }) => {
			const updatedData = getDataCopy();
			const app = updatedData.find(({ id }) => id === appId);

			if (!app) {
				return;
			}
			app.status = status;
			setData(updatedData);
			invalidateData();
		},
		APP_SETTING_UPDATED: () => {
			invalidateData();
		},
	};

	useEffect(() => {
		const unregisterListeners = registerListeners(listeners);
		(async () => {
			try {
				const [marketplaceApps, installedApps] = await Promise.all([Apps.getAppsFromMarketplace(), Apps.getApps()]);
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
						status: installedApp.status,
						version: installedApp.version,
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

	return { data, dataCache };
}
