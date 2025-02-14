import { useMemo, useSyncExternalStore } from 'react';

import { createReactiveSubscriptionFactory } from '../lib/createReactiveSubscriptionFactory';

export const useReactiveValue = <T>(computeCurrentValue: () => T): T => {
	const [subscribe, getSnapshot] = useMemo(() => createReactiveSubscriptionFactory<T>(computeCurrentValue)(), [computeCurrentValue]);

	return useSyncExternalStore(subscribe, getSnapshot);
};
