import { createContext, useContext } from 'react';

import { AsyncState, AsyncStatePhase } from '../../../lib/asyncState';
import { App } from './types';

type AppsContextValue = AsyncState<{ apps: App[] }> & { reload: () => Promise<void> };

export const AppsContext = createContext<AppsContextValue>({
	phase: AsyncStatePhase.LOADING,
	value: undefined,
	error: undefined,
	reload: () => Promise.resolve(),
});

export const useAppsReload = (): (() => void) => {
	const { reload } = useContext(AppsContext);
	return reload;
};
export const useAppsResult = (): AppsContextValue => useContext(AppsContext);
