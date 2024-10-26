import type { App } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useState, useEffect, useContext } from 'react';

import type { ISettings } from '../../../apps/@types/IOrchestrator';
import { AppClientOrchestratorInstance } from '../../../apps/orchestrator';
import { MarketplaceContext } from '../../../contexts/MarketplaceContext';
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
	const { apps } = useContext(MarketplaceContext);

	const [appData, setAppData] = useState<AppInfo>();

	const getSettings = useEndpoint('GET', '/apps/:id/settings', { id: appId });
	const getScreenshots = useEndpoint('GET', '/apps/:id/screenshots', { id: appId });
	const getApis = useEndpoint('GET', '/apps/:id/apis', { id: appId });
	const getBundledIn = useEndpoint('GET', '/apps/:id', { id: appId });

	useEffect(() => {
		const fetchAppInfo = async (): Promise<void> => {
			if ((!apps.data?.marketplace?.length && !apps.data?.installed.length && !apps.data?.private.length) || !appId) {
				return;
			}

			let appResult: App | undefined;
			const marketplaceAppsContexts = ['explore', 'premium', 'requested'];

			if (marketplaceAppsContexts.includes(context)) appResult = apps.data?.marketplace.find((app) => app.id === appId);

			if (context === 'private') appResult = apps.data?.private.find((app) => app.id === appId);

			if (context === 'installed') appResult = apps.data?.installed.find((app) => app.id === appId);

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
	}, [
		appId,
		apps.data?.installed,
		apps.data?.marketplace,
		apps.data?.private,
		context,
		getApis,
		getBundledIn,
		getScreenshots,
		getSettings,
	]);

	return appData;
};
