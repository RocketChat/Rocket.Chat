import { createContext, useContext } from 'react';

import { AsyncState, AsyncStatePhase } from '../../../lib/asyncState';
import { App } from './types';

type AppsContextValue = {
	installedApps: AsyncState<{ apps: App[] }>;
	marketplaceApps: AsyncState<{ apps: App[] }>;
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
	reload: () => Promise.resolve(),
});

export const useAppsReload = (): (() => void) => {
	const { reload } = useContext(AppsContext);
	return reload;
};

export const useAppsResult = (): AppsContextValue => useContext(AppsContext);
