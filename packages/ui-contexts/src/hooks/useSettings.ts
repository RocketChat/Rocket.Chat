import type { ISetting } from '@rocket.chat/core-typings';
import { useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { SettingsContext, SettingsContextQuery } from '../SettingsContext';

export const useSettings = (query?: SettingsContextQuery): ISetting[] => {
	const { querySettings } = useContext(SettingsContext);
	const subscription = useMemo(() => querySettings(query ?? {}), [querySettings, query]);
	return useSubscription(subscription);
};
