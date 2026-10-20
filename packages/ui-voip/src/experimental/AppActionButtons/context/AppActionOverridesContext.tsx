import { createContext, useContext } from 'react';

import type { AppActionUpdate, MediaCallAppAction } from './MediaCallAppActionsContext';

type AppActionOverrides = Record<MediaCallAppAction['key'], AppActionUpdate>;

type AppActionOverridesContextValue = {
	/** Persisted button state updates of the given call, keyed by action key. */
	getOverrides: (callId: string) => AppActionOverrides;
	/** Merges `update` into the stored entry for `key` within the given call. */
	setOverride: (callId: string, key: MediaCallAppAction['key'], update: AppActionUpdate) => void;
};

const AppActionOverridesContext = createContext<AppActionOverridesContextValue>({
	getOverrides: () => ({}),
	setOverride: () => undefined,
});

export const useAppActionOverrides = () => useContext(AppActionOverridesContext);

export default AppActionOverridesContext;
