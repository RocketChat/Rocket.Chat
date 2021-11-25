import { createContext } from 'react';

import { AsyncState, AsyncStatePhase } from '../../../lib/asyncState';
import { App } from './types';

type AppsContextValue = AsyncState<{ apps: App[] }>;

export const AppsContext = createContext<AppsContextValue>({
	phase: AsyncStatePhase.LOADING,
	value: undefined,
	error: undefined,
});
