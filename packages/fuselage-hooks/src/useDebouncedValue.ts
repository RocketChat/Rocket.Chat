import { useEffect, useState } from 'react';

/**
 * Hook to keep a debounced reference of a value.
 *
 * @param value - the value to be debounced
 * @param delay - the number of milliseconds to delay
 * @returns a debounced value
 * @public
 */
export const useDebouncedValue = <V>(value: V, delay: number): V => {
	const [debouncedValue, setDebouncedValue] = useState(() => value);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(() => value);
		}, delay);

		return () => {
			clearTimeout(timer);
		};
	}, [value, delay]);

	return debouncedValue;
};
