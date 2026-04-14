import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import type { RouterContextValue } from '@rocket.chat/ui-contexts';
import { useEffect, useRef, useSyncExternalStore } from 'react';

export const TARGET_ANCHORS = {
	clockMode: 'clockMode',
	hideUsernames: 'hideUsernames',
	hideRoles: 'hideRoles',
} as const;

export const availableHashes: Set<string> = new Set(Object.values(TARGET_ANCHORS));

/**
 * Scrolls to the element matching the current URL hash on route changes,
 * only if the hash matches a registered anchor in `TARGET_ANCHORS`.
 *
 * @see docs/anchor-navigation.md
 */
export const useRouterScrollToHash = (router: RouterContextValue) => {
	const hash = useSyncExternalStore(router.subscribeToRouteChange, router.getLocationHash);
	const reducedMotion = usePrefersReducedMotion();
	const id = hash.slice(1);
	const hasValidHash = availableHashes.has(id);

	const previousHash = useRef(hash);

	useEffect(() => {
		if (!hasValidHash || hash === previousHash.current) {
			previousHash.current = hash;
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
	}, [hash, id, hasValidHash, reducedMotion]);
};
