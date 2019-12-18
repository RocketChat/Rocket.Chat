import { useEffect, useRef } from 'react';

export const useIsMounted = () => {
	const mounted = useRef(true);

	useEffect(() => {
		mounted.current = true;

		return () => {
			mounted.current = false;
		};
	}, [mounted]);

	return () => mounted.current;
};
