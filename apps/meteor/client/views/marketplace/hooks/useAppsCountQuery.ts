import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { usePrivateAppsDisabled } from './usePrivateAppsDisabled';

type Variant = 'success' | 'warning' | 'danger';

const getProgressBarValues = (numberOfEnabledApps: number, enabledAppsLimit: number): { variant: Variant; percentage: number } => ({
	variant: 'success',
	...(numberOfEnabledApps + 1 === enabledAppsLimit && { variant: 'warning' }),
	...((enabledAppsLimit === 0 || numberOfEnabledApps >= enabledAppsLimit) && { variant: 'danger' }),
	percentage: Math.round(enabledAppsLimit === 0 ? 100 : (numberOfEnabledApps / enabledAppsLimit) * 100),
});

export type MarketplaceRouteContext = 'private' | 'explore' | 'installed' | 'premium' | 'requested' | 'details';

export function isMarketplaceRouteContext(context: string): context is MarketplaceRouteContext {
	return ['private', 'explore', 'installed', 'premium', 'requested'].includes(context);
}

export const useAppsCountQuery = (context: MarketplaceRouteContext) => {
	const getAppsCount = useEndpoint('GET', '/apps/count');
	const { t } = useTranslation();
	const privateAppsDisabled = usePrivateAppsDisabled();

	return useQuery(
		['apps/count', context],
		async () => {
			const data = await getAppsCount();

			const numberOfEnabledApps = context === 'private' ? data.totalPrivateEnabled : data.totalMarketplaceEnabled;
			const enabledAppsLimit = context === 'private' ? data.maxPrivateApps : data.maxMarketplaceApps;
			const hasUnlimitedApps = enabledAppsLimit === -1;
			const tooltip = context === 'private' && privateAppsDisabled ? t('Private_apps_premium_message') : undefined;
			return {
				hasUnlimitedApps,
				enabled: numberOfEnabledApps,
				limit: enabledAppsLimit,
				tooltip,
				...getProgressBarValues(numberOfEnabledApps, enabledAppsLimit),
			};
		},
		{ staleTime: 10_000 },
	);
};

export const useInvalidateAppsCountQueryCallback = () => {
	const queryClient = useQueryClient();
	return useCallback(() => {
		queryClient.invalidateQueries(['apps/count']);
	}, [queryClient]);
};
