import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import { useEffect } from 'react';

export const FIELD_ANCHORS = {
	clockMode: 'clockMode',
	hideUsernames: 'hideUsernames',
	hideRoles: 'hideRoles',
} as const;

const availableHashes: Set<string> = new Set(Object.values(FIELD_ANCHORS));

/**
 * Reads the URL hash fragment and scrolls to the matching element on mount.
 * Returns `shouldExpand` to indicate whether the hash matches a known field anchor,
 * useful for auto-expanding accordion sections that contain the target field.
 *
 * @see docs/anchor-navigation.md
 */
export const useScrollToHash = () => {
	const hash = window.location.hash.slice(1);
	const shouldExpand = availableHashes.has(hash);
	const reducedMotion = usePrefersReducedMotion();

	useEffect(() => {
		if (!hash) {
			return;
		}

		const frame = requestAnimationFrame(() => {
			document.getElementById(hash)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
		});

		return () => cancelAnimationFrame(frame);
	}, [hash, reducedMotion]);

	return { shouldExpand };
};
