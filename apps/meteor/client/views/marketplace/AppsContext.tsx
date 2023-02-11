import { createContext, useContext } from 'react';

import type { AsyncState } from '../../lib/asyncState';
import { AsyncStatePhase } from '../../lib/asyncState';
import type { App } from './types';

type AppsContextValue = {
	installedApps: AsyncState<{ apps: App[] }>;
	marketplaceApps: AsyncState<{ apps: App[] }>;
	privateApps: AsyncState<{ apps: App[] }>;
	appsCount: { totalMarketplaceEnabled: number; totalPrivateEnabled: number; maxMarketplaceApps: number; maxPrivateApps: number };
	reload: () => Promise<void>;
};

export const initialAppsCount: AppsContextValue['appsCount'] = {
	totalMarketplaceEnabled: 0,
	totalPrivateEnabled: 0,
	maxMarketplaceApps: 0,
	maxPrivateApps: 0,
};

export const AppsContext = createContext<AppsContextValue>({
	installedApps: {
		phase: AsyncStatePhase.LOADING,
		value: undefined,
		error: undefined,
	},
	marketplaceApps: {
		phase: AsyncStatePhase.LOADING,
		value: undefined,
		error: undefined,
	},
	privateApps: {
		phase: AsyncStatePhase.LOADING,
		value: undefined,
		error: undefined,
	},
	appsCount: initialAppsCount,
	reload: () => Promise.resolve(),
});

export const useAppsReload = (): (() => void) => {
	const { reload } = useContext(AppsContext);
	return reload;
};

export const useAppsCount = (): AppsContextValue['appsCount'] => {
	const { appsCount } = useContext(AppsContext);
	return appsCount;
};

export const useAppsResult = (): AppsContextValue => useContext(AppsContext);
