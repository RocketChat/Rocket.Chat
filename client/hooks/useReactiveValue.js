import { useState, useEffect } from 'react';
import { Tracker } from 'meteor/tracker';

export const useReactiveValue = (getValue, deps = []) => {
	const [value, setValue] = useState(() => Tracker.nonreactive(getValue));

	useEffect(() => {
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
