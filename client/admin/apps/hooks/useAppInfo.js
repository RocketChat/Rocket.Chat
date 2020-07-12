import { useState, useEffect, useContext } from 'react';

import { Apps } from '../../../../app/apps/client/orchestrator';
import { AppDataContext } from '../AppProvider';
import { handleAPIError } from '../helpers';

const getBundledIn = async (appId, appVersion) => {
	try {
		const { bundledIn } = await Apps.getLatestAppFromMarketplace(appId, appVersion);
		bundledIn && await Promise.all(bundledIn.map((bundle, i) => Apps.getAppsOnBundle(bundle.bundleId).then((value) => {
			bundle.apps = value.slice(0, 4);
			bundledIn[i] = bundle;
		})));
		return bundledIn;
	} catch (e) {
		handleAPIError(e);
	}
};

const getSettings = async (appId, installed) => {
	if (!installed) { return {}; }
	try {
		const settings = await Apps.getAppSettings(appId);
		return settings;
	} catch (e) {
		handleAPIError(e);
	}
};

const getApis = async (appId, installed) => {
	if (!installed) { return {}; }
	try {
		return await Apps.getAppApis(appId);
	} catch (e) {
		handleAPIError(e);
	}
};

export const useAppInfo = (appId) => {
	const { data, dataCache } = useContext(AppDataContext);

	const [appData, setAppData] = useState({});

	useEffect(() => {
		(async () => {
			if (!data.length || !appId) { return; }

			let app = data.find(({ id }) => id === appId);

			if (!app) {
				const localApp = await Apps.getApp(appId);
				app = { ...localApp, installed: true, marketplace: false };
			}

			if (app.marketplace === false) {
				const [settings, apis] = await Promise.all([getSettings(app.id, app.installed), getApis(app.id, app.installed)]);
				return setAppData({ ...app, settings, apis });
			}

			const [
				bundledIn,
				settings,
				apis,
			] = await Promise.all([
				getBundledIn(app.id, app.version),
				getSettings(app.id, app.installed),
				getApis(app.id, app.installed),
			]);

			setAppData({ ...app, bundledIn, settings, apis });
		})();
	}, [appId, data, dataCache]);

	return appData;
};
