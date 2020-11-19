import { createContext } from 'react';

import { App } from './types';

type AppsContextValue = {
	apps: App[];
	finishedLoading: boolean;
}

export const AppsContext = createContext<AppsContextValue>({
	apps: [],
	finishedLoading: false,
});
