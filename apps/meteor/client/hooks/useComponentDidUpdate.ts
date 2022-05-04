import { useEffect, useRef } from 'react';

export const useComponentDidUpdate = (effect: Function, dependencies: unknown[] = []): void => {
	const hasMounted = useRef(false);
	useEffect(() => {
		if (!hasMounted.current) {
			hasMounted.current = true;
			return;
		}
		effect();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, dependencies);
};
