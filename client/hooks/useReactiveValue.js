import { useState, useEffect } from 'react';
import { Tracker } from 'meteor/tracker';

export const useReactiveValue = (getValue, deps = []) => {
	const [value, setValue] = useState(() => Tracker.nonreactive(getValue));

	useEffect(() => {
		const computation = Tracker.autorun(({ firstRun }) => {
			const newValue = getValue();
			if (!firstRun) {
				setValue(() => newValue);
			}
		});

		return () => {
			computation.stop();
		};
	}, deps);

	return value;
};
