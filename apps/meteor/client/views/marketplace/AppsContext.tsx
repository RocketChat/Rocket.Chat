import { createContext, useContext } from 'react';

import type { AsyncState } from '../../lib/asyncState';
import { AsyncStatePhase } from '../../lib/asyncState';
import type { App } from './types';

type AppsContextValue = {
	installedApps: AsyncState<{ apps: App[] }>;
	marketplaceApps: AsyncState<{ apps: App[] }>;
	numberOfMarketplaceEnabledApps: number;
	numberOfPrivateEnabledApps: number;
	reload: () => Promise<void>;
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

	numberOfMarketplaceEnabledApps: 0,
	numberOfPrivateEnabledApps: 0,
	reload: () => Promise.resolve(),
});

export const useAppsReload = (): (() => void) => {
	const { reload } = useContext(AppsContext);
	return reload;
};

export const useNumberOfMarketplaceEnabledApps = (): number => {
	const { numberOfMarketplaceEnabledApps } = useContext(AppsContext);
	return numberOfMarketplaceEnabledApps;
};

export const useNumberOfPrivateEnabledApps = (): number => {
	const { numberOfPrivateEnabledApps } = useContext(AppsContext);
	return numberOfPrivateEnabledApps;
};

export const useAppsResult = (): AppsContextValue => useContext(AppsContext);
