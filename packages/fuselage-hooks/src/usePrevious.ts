import { useEffect, useRef } from 'react';

export const usePrevious = <T>(value: T): T | undefined => {
	const ref = useRef<T>(undefined);

	useEffect(() => {
		ref.current = value;
	});

	return ref.current;
};
