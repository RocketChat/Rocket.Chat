import type { App } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useState, useEffect } from 'react';

import { useApps } from './useApps';
import type { ISettings } from '../../../apps/@types/IOrchestrator';
import { AppClientOrchestratorInstance } from '../../../apps/orchestrator';
import type { AppInfo } from '../definitions/AppInfo';

const getBundledInApp = async (app: App): Promise<App['bundledIn']> => {
	const { bundledIn = [] } = app;

	return Promise.all(
		bundledIn.map(async (bundle) => {
			const apps = await AppClientOrchestratorInstance.getAppsOnBundle(bundle.bundleId);
			bundle.apps = apps.slice(0, 4);
			return bundle;
		}),
	);
};

export const useAppInfo = (appId: string, context: string): AppInfo | undefined => {
	const { data: { installedApps, marketplaceApps, privateApps } = {} } = useApps();

	const [appData, setAppData] = useState<AppInfo>();

	const getSettings = useEndpoint('GET', '/apps/:id/settings', { id: appId });
	const getScreenshots = useEndpoint('GET', '/apps/:id/screenshots', { id: appId });
	const getApis = useEndpoint('GET', '/apps/:id/apis', { id: appId });
	const getBundledIn = useEndpoint('GET', '/apps/:id', { id: appId });

	useEffect(() => {
		const fetchAppInfo = async (): Promise<void> => {
			if ((!marketplaceApps?.length && !installedApps?.length && !privateApps?.length) || !appId) {
				return;
			}

			let appResult: App | undefined;
			const marketplaceAppsContexts = ['explore', 'premium', 'requested'];

			if (marketplaceAppsContexts.includes(context)) appResult = marketplaceApps?.find((app) => app.id === appId);

			if (context === 'private') appResult = privateApps?.find((app) => app.id === appId);

			if (context === 'installed') appResult = installedApps?.find((app) => app.id === appId);

			if (!appResult) return;

			const [settings, apis, screenshots, bundledIn] = await Promise.all([
				getSettings().catch(() => ({
					settings: {},
				})),
				getApis().catch(() => ({
					apis: [],
				})),
				getScreenshots().catch(() => ({
					screenshots: [],
				})),
				appResult.marketplace === false
					? []
					: getBundledIn({
							marketplace: 'true',
							update: 'true',
							appVersion: appId,
						})
							.then(({ app }: any) => {
								(appResult as App).tosLink = app.tosLink;
								(appResult as App).privacyLink = app.privacyLink;
								return getBundledInApp(app);
							})
							.catch(() => ({
								settings: {},
							})),
			]);

			setAppData({
				...appResult,
				bundledIn: bundledIn as App['bundledIn'],
				settings: settings.settings as ISettings,
				apis: apis ? apis.apis : [],
				screenshots: screenshots ? screenshots.screenshots : [],
			});
		};

		fetchAppInfo();
	}, [appId, context, getApis, getBundledIn, getScreenshots, getSettings, installedApps, marketplaceApps, privateApps]);

	return appData;
};
