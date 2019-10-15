import { useEffect, useState } from 'react';

import { useTracker } from './useTracker';

export const useReactiveValue = (getValue, deps = []) => {
	const Tracker = useTracker();
	const [value, setValue] = useState(getValue);

	useEffect(() => {
		if (!Tracker) {
			return;
		}

		const computation = Tracker.autorun(() => {
			const newValue = getValue();
			setValue(() => newValue);
		});

		return () => {
			computation.stop();
		};
	}, deps);

	return value;
};
