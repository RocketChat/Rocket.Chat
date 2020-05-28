import { useRef, useState, useEffect, useMemo } from 'react';

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

/* TODO
 *	If order is reversed and search is performed, the result will return in the wrong order, then refresh correctly
 */
export function useMarketplaceApps({ text, sort, current, itemsPerPage }) {
	const [data, setData] = useState({});
	const ref = useRef();
	ref.current = data;

	const getDataCopy = () => ref.current.slice(0);

	const stringifiedData = JSON.stringify(data);

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
		} catch (error) {
			handleAPIError(error);
		}
	};

	const listeners = {
		APP_ADDED: handleAppAddedOrUpdated,
		APP_UPDATED: handleAppAddedOrUpdated,
		APP_REMOVED: (appId) => {
			const updatedData = getDataCopy();
			const app = updatedData.find(({ id }) => id === appId);
			if (!app) {
				return;
			}
			delete app.installed;
			delete app.status;
			app.version = app.marketplaceVersion;

			setData(updatedData);
		},
		APP_STATUS_CHANGE: ({ appId, status }) => {
			const updatedData = getDataCopy();
			const app = updatedData.find(({ id }) => id === appId);

			if (!app) {
				return;
			}
			app.status = status;
			setData(updatedData);
		},
	};

	useEffect(() => {
		const unregisterListeners = registerListeners(listeners);
		(async () => {
			try {
				const marketAndInstalledApps = await Promise.all([Apps.getAppsFromMarketplace(), Apps.getApps()]);
				const appsData = marketAndInstalledApps[0].map((app) => {
					const installedApp = marketAndInstalledApps[1].find(({ id }) => id === app.id);
					if (!installedApp) {
						return {
							...app,
							status: undefined,
							marketplaceVersion: app.version,
						};
					}

					return {
						...app,
						installed: true,
						status: installedApp.status,
						version: installedApp.version,
						marketplaceVersion: app.version,
					};
				});

				setData(appsData.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1)));
			} catch (e) {
				handleAPIError(e);
				unregisterListeners();
			}
		})();

		return unregisterListeners;
	}, []);

	const filteredValues = useMemo(() => {
		if (data.length) {
			let filtered = sort[1] === 'asc' ? data : data.reverse();

			filtered = text ? filtered.filter((app) => app.name.toLowerCase().indexOf(text.toLowerCase()) > -1) : filtered;

			const filteredLength = filtered.length;

			const sliceStart = current > filteredLength ? 0 : current;

			filtered = filtered.slice(sliceStart, current + itemsPerPage);

			return [filtered, filteredLength];
		}
		return [null, 0];
	}, [text, sort[1], stringifiedData, current, itemsPerPage]);

	return [...filteredValues];
}
