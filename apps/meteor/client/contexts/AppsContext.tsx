import { createContext } from 'react';

import type { AsyncState } from '../lib/asyncState';
import { AsyncStatePhase } from '../lib/asyncState';
import type { App } from '../views/marketplace/types';

export type AppsContextValue = {
	installedApps: Omit<AsyncState<{ apps: App[] }>, 'error'>;
	marketplaceApps: Omit<AsyncState<{ apps: App[] }>, 'error'>;
	privateApps: Omit<AsyncState<{ apps: App[] }>, 'error'>;
	reload: () => Promise<void>;
};

export const AppsContext = createContext<AppsContextValue>({
	installedApps: {
		phase: AsyncStatePhase.LOADING,
		value: undefined,
	},
	marketplaceApps: {
		phase: AsyncStatePhase.LOADING,
		value: undefined,
	},
	privateApps: {
		phase: AsyncStatePhase.LOADING,
		value: undefined,
	},
	reload: () => Promise.resolve(),
});
