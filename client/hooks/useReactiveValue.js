import { Tracker } from 'meteor/tracker';
import { useEffect, useState } from 'react';

export const useReactiveValue = (getValue) => {
	const [value, setValue] = useState(getValue);

	useEffect(() => {
		const computation = Tracker.autorun(() => {
			setValue(getValue);
		});

		return () => {
			computation.stop();
		};
	}, []);

	return value;
};
