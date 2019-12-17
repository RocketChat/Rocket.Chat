import { Tracker } from 'meteor/tracker';
import { useCallback } from 'react';

import { useSubscription } from './useSubscription';

export const useReactiveValue = (getValue, deps = []) => {
	const getInitialValue = () => Tracker.nonreactive(getValue);

	const subscribe = useCallback((fn) => {
		const computation = Tracker.autorun(() => {
			fn(getValue());
		});

		return () => {
			computation.stop();
		};
	}, deps);

	return useSubscription(getInitialValue, subscribe);
};
