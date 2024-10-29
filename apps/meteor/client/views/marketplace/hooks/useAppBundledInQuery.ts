import type { App } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useAppQuery } from './useAppQuery';
import { useAppsOrchestrator } from './useAppsOrchestrator';

export const useAppBundledInQuery = (appId: App['id']) => {
	const { isLoading, isError, error, data: appResult } = useAppQuery(appId);

	const getApp = useEndpoint('GET', '/apps/:id', { id: appId });

	const appsOrchestrator = useAppsOrchestrator();

	return useQuery({
		queryKey: ['marketplace', 'apps', { appId }, 'bundledIn'] as const,
		queryFn: async () => {
			if (isError) {
				throw error;
			}

			if (isLoading) {
				throw new Error('Unexpected state');
			}

			if (!appResult.marketplace) {
				return [];
			}

			const { app } = await getApp({
				marketplace: 'true',
				update: 'true',
				appVersion: appId,
			});

			return Promise.all(
				app.bundledIn.map(async (bundle) => {
					const apps = await appsOrchestrator.getAppsOnBundle(bundle.bundleId);
					return { ...bundle, apps: apps.slice(0, 4) };
				}),
			);
		},
		enabled: !isLoading,
	});
};
