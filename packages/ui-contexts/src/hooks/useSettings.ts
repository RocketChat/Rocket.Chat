import type { ISetting } from '@rocket.chat/core-typings';
import { useContext, useMemo, useSyncExternalStore } from 'react';

import type { SettingsContextQuery } from '../SettingsContext';
import { SettingsContext } from '../SettingsContext';

export const useSettings = (query?: SettingsContextQuery): ISetting[] => {
	const { querySettings } = useContext(SettingsContext);
	const [subscribe, getSnapshot] = useMemo(() => querySettings(query ?? {}), [querySettings, query]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
