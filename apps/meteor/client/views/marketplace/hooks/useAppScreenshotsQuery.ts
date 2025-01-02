import type { Serialized, AppScreenshot, App } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { type UseQueryOptions, useQuery } from '@tanstack/react-query';

import { marketplaceQueryKeys } from '../queryKeys';

type UseAppScreenshotsQueryOptions<TData = Serialized<AppScreenshot[]>> = Omit<
	UseQueryOptions<
		Serialized<AppScreenshot[]>,
		Error,
		TData,
		readonly [
			'marketplace',
			'apps',
			{
				readonly appId: string;
			},
			'screenshots',
		]
	>,
	'queryKey' | 'queryFn'
>;

export const useAppScreenshotsQuery = <TData = Serialized<AppScreenshot[]>>(
	appId: App['id'],
	options?: UseAppScreenshotsQueryOptions<TData>,
) => {
	const getScreenshots = useEndpoint('GET', '/apps/:id/screenshots', { id: appId });

	return useQuery({
		queryKey: marketplaceQueryKeys.app.screenshots(appId),
		queryFn: async () => {
			const { screenshots } = await getScreenshots();

			return screenshots ?? [];
		},
		...options,
	});
};
