import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import type { RouterContextValue } from '@rocket.chat/ui-contexts';
import { useEffect, useRef, useSyncExternalStore } from 'react';

/**
 * Scrolls to the element matching the current URL hash on route changes.
 *
 * @see docs/anchor-navigation.md
 */
export const useRouterScrollToHash = (router: RouterContextValue) => {
	const hash = useSyncExternalStore(router.subscribeToRouteChange, router.getLocationHash);
	const reducedMotion = usePrefersReducedMotion();

	const previousHash = useRef<string | null>(null);

	useEffect(() => {
		const id = hash.slice(1);

		if (!id) {
			previousHash.current = hash;
			return;
		}

		if (hash === previousHash.current) {
			return;
		}

		previousHash.current = hash;

		const frame = requestAnimationFrame(() => {
			document.getElementById(id)?.scrollIntoView({
				behavior: reducedMotion ? 'auto' : 'smooth',
				block: 'start',
			});
		});

		return () => cancelAnimationFrame(frame);
	}, [hash, reducedMotion]);
};
