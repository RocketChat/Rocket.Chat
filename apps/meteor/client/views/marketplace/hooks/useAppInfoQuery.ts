import type { App } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import type { ISettings } from '../../../apps/@types/IOrchestrator';
import { useAppsOrchestrator } from './useAppsOrchestrator';
import { useMarketplaceContext } from './useMarketplaceContext';
import { useMarketplaceQueryWithContext } from './useMarketplaceQuery';

export const useAppInfoQuery = (appId: App['id']) => {
	const context = useMarketplaceContext();
	const { isLoading, isError, error, data } = useMarketplaceQueryWithContext();

	const getSettings = useEndpoint('GET', '/apps/:id/settings', { id: appId });
	const getScreenshots = useEndpoint('GET', '/apps/:id/screenshots', { id: appId });
	const getApis = useEndpoint('GET', '/apps/:id/apis', { id: appId });
	const getBundledIn = useEndpoint('GET', '/apps/:id', { id: appId });

	const appsOrchestrator = useAppsOrchestrator();

	const getBundledInApp = useEffectEvent(async (app: App): Promise<App['bundledIn']> => {
		const { bundledIn = [] } = app;

		return Promise.all(
			bundledIn.map(async (bundle) => {
				const apps = await appsOrchestrator.getAppsOnBundle(bundle.bundleId);
				bundle.apps = apps.slice(0, 4);
				return bundle;
			}),
		);
	});

	return useQuery({
		queryKey: ['marketplace', 'apps', { appId, context }] as const,
		queryFn: async () => {
			if (isError) {
				throw error;
			}

			if (isLoading) {
				throw new Error('Unexpected state');
			}

			const appResult = data.find((app) => app.id === appId);

			if (!appResult) {
				return null;
			}

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
							.then(({ app }) => {
								appResult.tosLink = app.tosLink;
								appResult.privacyLink = app.privacyLink;
								return getBundledInApp(app);
							})
							.catch(() => ({
								settings: {},
							})),
			]);

			return {
				...appResult,
				bundledIn: bundledIn as App['bundledIn'],
				settings: settings.settings as ISettings,
				apis: apis ? apis.apis : [],
				screenshots: screenshots ? screenshots.screenshots : [],
			};
		},
		enabled: !isLoading,
	});
};
