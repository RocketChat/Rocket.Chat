import { useEndpoint, EndpointFunction } from '@rocket.chat/ui-contexts';
import { useState, useEffect, useContext } from 'react';

import { ISettings } from '../../../../../app/apps/client/@types/IOrchestrator';
import { Apps } from '../../../../../app/apps/client/orchestrator';
import { AppsContext } from '../AppsContext';
import { AppInfo } from '../definitions/AppInfo';
import { App } from '../types';

const getBundledInApp = async (app: App): Promise<App['bundledIn']> => {
	const { bundledIn = [] } = app;

	return Promise.all(
		bundledIn.map(async (bundle) => {
			const apps = await Apps.getAppsOnBundle(bundle.bundleId);
			bundle.apps = apps.slice(0, 4);
			return bundle;
		}),
	);
};

export const useAppInfo = (appId: string): AppInfo | undefined => {
	const { installedApps, marketplaceApps } = useContext(AppsContext);

	const [appData, setAppData] = useState<AppInfo>();

	const getSettings = useEndpoint('GET', `/apps/${appId}/settings`);
	const getScreenshots = useEndpoint('GET', `/apps/${appId}/screenshots`);
	const getApis = useEndpoint('GET', `/apps/${appId}/apis`);

	// TODO: remove EndpointFunction<'GET', 'apps/:id'>
	const getBundledIn = useEndpoint('GET', `/apps/${appId}`) as EndpointFunction<'GET', '/apps/:id'>;

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

			const [bundledIn, settings, apis, screenshots] = await Promise.all([
				app.marketplace === false
					? []
					: getBundledIn({
							marketplace: 'true',
							update: 'true',
							appVersion: appId,
					  })
							.then(({ app }) => getBundledInApp(app))
							.catch(() => ({
								settings: {},
							})),
				getSettings().catch(() => ({
					settings: {},
				})),
				getApis().catch(() => ({
					apis: [],
				})),
				getScreenshots().catch(() => ({
					screenshots: [],
				})),
			]);

			setAppData({
				...app,
				bundledIn: bundledIn as App['bundledIn'],
				settings: settings.settings as ISettings,
				apis: apis ? apis.apis : [],
				screenshots: screenshots ? screenshots.screenshots : [],
			});
		};

		fetchAppInfo();
	}, [appId, getApis, getBundledIn, getScreenshots, getSettings, installedApps, marketplaceApps]);

	return appData;
};
