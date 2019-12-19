import { Tracker } from 'meteor/tracker';
import { useCallback } from 'react';

import { useObservableValue } from './useObservableValue';

const wrapGetValue = (getValue) => (listener) => {
	if (!listener) {
		return Tracker.nonreactive(getValue);
	}

	const computation = Tracker.autorun(({ firstRun }) => {
		const value = getValue();
		if (!firstRun) {
			listener(value);
		}
	});

	return () => {
		computation.stop();
	};
};

export const useReactiveValue = (getValue, deps = []) => useObservableValue(useCallback(wrapGetValue(getValue), deps));
