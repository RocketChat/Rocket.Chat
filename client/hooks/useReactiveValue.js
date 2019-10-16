import { useState } from 'react';
import { Tracker } from 'meteor/tracker';

import { useAutorun } from './useAutorun';

export const useReactiveValue = (getValue, deps = []) => {
	const [value, setValue] = useState(() => Tracker.nonreactive(getValue));

	useAutorun(() => {
		setValue(getValue);
	}, deps);

	return value;
};
