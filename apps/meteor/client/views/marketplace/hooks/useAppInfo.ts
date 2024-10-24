import type { App } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueries } from '@tanstack/react-query';
import { useContext } from 'react';

import { AppClientOrchestratorInstance } from '../../../apps/orchestrator';
import type { AppsContextValue } from '../../../contexts/AppsContext';
import { AppsContext } from '../../../contexts/AppsContext';
import type { MarketplaceRouteContext } from '../definitions/MarketplaceRouterContext';

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

const getAppByContext = (
	appId: App['id'],
	context: MarketplaceRouteContext,
	{ installedApps, marketplaceApps, privateApps }: AppsContextValue,
) => {
	if ((!marketplaceApps.value?.apps?.length && !installedApps.value?.apps.length && !privateApps.value?.apps.length) || !appId) {
		return;
	}

	const marketplaceAppsContexts = ['explore', 'premium', 'requested'];

	if (marketplaceAppsContexts.includes(context)) return marketplaceApps.value?.apps.find((app) => app.id === appId);
	if (context === 'private') return privateApps.value?.apps.find((app) => app.id === appId);
	if (context === 'installed') return installedApps.value?.apps.find((app) => app.id === appId);
};

export const useAppInfo = (appId: App['id'], context: MarketplaceRouteContext) => {
	const appsContextValue = useContext(AppsContext);

	const getSettings = useEndpoint('GET', '/apps/:id/settings', { id: appId });
	const getApis = useEndpoint('GET', '/apps/:id/apis', { id: appId });
	const getScreenshots = useEndpoint('GET', '/apps/:id/screenshots', { id: appId });
	const getBundledIn = useEndpoint('GET', '/apps/:id', { id: appId });

	const app = getAppByContext(appId, context, appsContextValue);

	const [settingsQuery, apisQuery, screenshotsQuery, bundledInQuery] = useQueries({
		queries: [
			{
				queryKey: ['marketplace', 'getSettings'],
				queryFn: async () => {
					return (await getSettings()) || { settings: [] };
				},
				staleTime: Infinity,
			},
			{
				queryKey: ['marketplace', 'getApis'],
				queryFn: async () => {
					return getApis() || { apis: [] };
				},
				staleTime: Infinity,
			},
			{
				queryKey: ['marketplace', 'getScreenshots'],
				queryFn: async () => {
					return getScreenshots() || { screenshots: [] };
				},
				staleTime: Infinity,
			},
			{
				queryKey: ['marketplace', 'getBundledIn'],
				queryFn: async () => {
					if (!app) return [];

					return app.marketplace === false
						? []
						: getBundledIn({
								marketplace: 'true',
								update: 'true',
								appVersion: appId,
						  }).then(({ app }: { app: App }) => {
								app.tosLink = app.tosLink;
								app.privacyLink = app.privacyLink;
								return getBundledInApp(app);
						  });
				},
				staleTime: Infinity,
			},
		],
	});

	return {
		app,
		bundledInQuery,
		settingsQuery,
		apisQuery,
		screenshotsQuery,
	};
};
