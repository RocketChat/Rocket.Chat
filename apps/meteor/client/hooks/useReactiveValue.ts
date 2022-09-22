import { useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { createReactiveSubscriptionFactory } from '../lib/createReactiveSubscriptionFactory';

export const useReactiveValue = <T>(computeCurrentValue: () => T): T => {
	const [subscribe, getSnapshot] = useMemo(() => createReactiveSubscriptionFactory<T>(computeCurrentValue)(), [computeCurrentValue]);

	return useSyncExternalStore(subscribe, getSnapshot);
};
