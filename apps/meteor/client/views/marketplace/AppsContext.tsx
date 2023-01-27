import { createContext, useContext } from 'react';

import type { AsyncState } from '../../lib/asyncState';
import { AsyncStatePhase } from '../../lib/asyncState';
import type { App } from './types';

type AppsContextValue = {
	installedApps: AsyncState<{ apps: App[] }>;
	marketplaceApps: AsyncState<{ apps: App[] }>;
	numberOfEnabledApps: number;
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

	numberOfEnabledApps: 0,
	reload: () => Promise.resolve(),
});

export const useAppsReload = (): (() => void) => {
	const { reload } = useContext(AppsContext);
	return reload;
};

export const useNumberOfEnabledApps = (): number => {
	const { numberOfEnabledApps } = useContext(AppsContext);
	return numberOfEnabledApps;
};

export const useAppsResult = (): AppsContextValue => useContext(AppsContext);
