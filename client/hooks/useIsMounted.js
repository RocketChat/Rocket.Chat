import { useCallback, useEffect, useRef } from 'react';

export const useIsMounted = () => {
	const mounted = useRef(true);

	useEffect(() => {
		mounted.current = true;

		return () => {
			mounted.current = false;
		};
	}, [mounted]);

	return useCallback(() => mounted.current, [mounted]);
};
