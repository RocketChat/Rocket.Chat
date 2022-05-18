import { useEffect, useRef } from 'react';

export const useMemoCompare = <T>(next: T, compare: (previous: T, next: T) => boolean): T => {
	const previousRef = useRef<T>(next);
	const previous = previousRef.current;

	const isEqual = compare(previous, next);

	useEffect(() => {
		if (!isEqual) {
			previousRef.current = next;
		}
	});

	return isEqual ? previous : next;
};
