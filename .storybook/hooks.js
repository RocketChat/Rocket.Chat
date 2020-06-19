import { useEffect, useState } from 'react';

export const useAutoToggle = (initialValue = false, ms = 1000) => {
	const [value, setValue] = useState(initialValue);

	useEffect(() => {
		const timer = setInterval(() => setValue((value) => !value), ms);

		return () => {
			clearInterval(timer);
		};
	}, [ms]);

	return value;
};
