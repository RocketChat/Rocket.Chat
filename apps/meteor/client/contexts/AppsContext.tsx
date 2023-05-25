import { createContext } from 'react';

import type { AsyncState } from '../lib/asyncState';
import { AsyncStatePhase } from '../lib/asyncState';
import type { App } from '../views/marketplace/types';

export type AppsContextValue = {
	installedApps: AsyncState<{ apps: App[] }>;
	marketplaceApps: AsyncState<{ apps: App[] }>;
	privateApps: AsyncState<{ apps: App[] }>;
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
	privateApps: {
		phase: AsyncStatePhase.LOADING,
		value: undefined,
		error: undefined,
	},
	reload: () => Promise.resolve(),
});
