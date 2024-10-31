import type { App } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import type { ISettings } from '../../../apps/@types/IOrchestrator';
import { useAppQuery } from './useAppQuery';
import { useAppsOrchestrator } from './useAppsOrchestrator';

export const useAppInfoQuery = (appId: App['id']) => {
	const { isLoading, isError, error, data: app } = useAppQuery(appId);

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
		queryKey: ['marketplace', 'apps', { app }] as const,
		queryFn: async () => {
			if (isError) {
				throw error;
			}

			if (isLoading) {
				throw new Error('Unexpected state');
			}

			if (!app) {
				return null;
			}

			const [settings, apis, screenshots, bundledIn] = await Promise.all([
				app.installed
					? getSettings().catch(() => ({
							settings: {},
						}))
					: { settings: {} },
				app.installed
					? getApis().catch(() => ({
							apis: [],
						}))
					: { apis: [] },
				getScreenshots().catch(() => ({
					screenshots: [],
				})),
				app.marketplace === false
					? ([] as App['bundledIn'])
					: getBundledIn({
							marketplace: 'true',
							update: 'true',
							appVersion: appId,
						}).then(({ app }) => {
							app.tosLink = app.tosLink;
							app.privacyLink = app.privacyLink;
							return getBundledInApp(app);
						}),
			]);

			return {
				...app,
				bundledIn,
				settings: settings.settings as ISettings,
				apis: apis ? apis.apis : [],
				screenshots: screenshots ? screenshots.screenshots : [],
			};
		},
		enabled: !isLoading,
	});
};
