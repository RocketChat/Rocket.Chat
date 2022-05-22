import { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import { useState, useEffect, useContext } from 'react';

import { ISettingsReturn } from '../../../../../app/apps/client/@types/IOrchestrator';
import { Apps } from '../../../../../app/apps/client/orchestrator';
import { AppsContext } from '../AppsContext';
import { AppInfo } from '../definitions/AppInfo';
import { handleAPIError } from '../helpers';
import { App } from '../types';

const getBundledIn = async (appId: string, appVersion: string): Promise<App['bundledIn']> => {
	try {
		const { bundledIn } = (await Apps.getLatestAppFromMarketplace(appId, appVersion)) as App;
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

const getSettings = async (appId: string, installed?: boolean): Promise<ISettingsReturn | undefined> => {
	if (!installed) {
		return;
	}

	try {
		return Apps.getAppSettings(appId);
	} catch (e) {
		handleAPIError(e);
	}
};

const getApis = async (appId: string, installed?: boolean): Promise<Array<IApiEndpointMetadata>> => {
	if (!installed) {
		return [];
	}

	try {
		return Apps.getAppApis(appId);
	} catch (e) {
		handleAPIError(e);
		return [];
	}
};

export const useAppInfo = (appId: string): AppInfo | undefined => {
	const { installedApps, marketplaceApps } = useContext(AppsContext);

	const [appData, setAppData] = useState<AppInfo>();

	useEffect(() => {
		const apps: App[] = [];

		if (marketplaceApps.value) {
			apps.push(...marketplaceApps.value.apps);
		}

		if (installedApps.value) {
			apps.push(...installedApps.value.apps);
		}

		const fetchAppInfo = async (): Promise<void> => {
			if (!apps?.length || !appId) {
				return;
			}

			const app = apps.find((app) => app.id === appId) ?? {
				...(await Apps.getApp(appId)),
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
	}, [appId, installedApps, marketplaceApps]);

	return appData;
};
