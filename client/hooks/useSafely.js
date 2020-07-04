import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEffect, useRef } from 'react';

export const useSafely = ([state, updater]) => {
	const mountedRef = useRef();

	useEffect(() => {
		mountedRef.current = true;

		return () => {
			mountedRef.current = false;
		};
	});

	const safeUpdater = useMutableCallback((...args) => {
		if (!mountedRef.current) {
			return;
		}

		updater(...args);
	});

	return [state, safeUpdater];
};
