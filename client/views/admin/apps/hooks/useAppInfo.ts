import { useState, useEffect, useContext } from 'react';

import { Apps } from '../../../../../app/apps/client/orchestrator';
import { AppsContext } from '../AppsContext';
import { handleAPIError } from '../helpers';
import { App } from '../types';

const getBundledIn = async (appId: string, appVersion: string): Promise<App['bundledIn']> => {
	try {
		const { bundledIn } = await Apps.getLatestAppFromMarketplace(appId, appVersion) as App;
		if (!bundledIn) {
			return [];
		}

		return await Promise.all(
			bundledIn.map(async (bundle) => {
				const apps = await Apps.getAppsOnBundle(bundle.bundleId);
				bundle.apps = apps.slice(0, 4);
				return bundle;
			}),
		);
	} catch (e) {
		handleAPIError(e);
		return [];
	}
};

const getSettings = async (appId: string, installed: boolean): Promise<Record<string, unknown>> => {
	if (!installed) {
		return {};
	}

	try {
		return Apps.getAppSettings(appId);
	} catch (e) {
		handleAPIError(e);
		return {};
	}
};

const getApis = async (appId: string, installed: boolean): Promise<Record<string, unknown>> => {
	if (!installed) {
		return {};
	}

	try {
		return Apps.getAppApis(appId);
	} catch (e) {
		handleAPIError(e);
		return {};
	}
};

type AppInfo = Partial<App & {
	settings: Record<string, unknown>;
	apis: Record<string, unknown>;
}>;

export const useAppInfo = (appId: string): AppInfo => {
	const { apps } = useContext(AppsContext);

	const [appData, setAppData] = useState({});

	useEffect(() => {
		const fetchAppInfo = async (): Promise<void> => {
			if (!apps.length || !appId) {
				return;
			}

			const app = apps.find((app) => app.id === appId) ?? {
				...await Apps.getApp(appId),
				installed: true,
				marketplace: false,
			};

			const [bundledIn, settings, apis] = await Promise.all([
				app.marketplace === false ? [] : getBundledIn(app.id, app.version),
				getSettings(app.id, app.installed),
				getApis(app.id, app.installed),
			]);
			setAppData({ ...app, bundledIn, settings, apis });
		};

		fetchAppInfo();
	}, [appId, apps]);

	return appData;
};
