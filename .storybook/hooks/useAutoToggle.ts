import { useEffect, useState } from 'react';

export const useAutoToggle = (initialValue = false, ms = 1000): boolean => {
	const [value, setValue] = useState(initialValue);

	useEffect(() => {
		const timer = setInterval(() => setValue((value) => !value), ms);

		return (): void => {
			clearInterval(timer);
		};
	}, [ms]);

	return value;
};
