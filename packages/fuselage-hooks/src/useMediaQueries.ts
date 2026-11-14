import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';

import { useStableArray } from './useStableArray';

/**
 * Hook to listen to a set of media queries.
 *
 * @param queries - the CSS3 expressions of media queries
 * @returns a set of booleans expressing if the media queries match or not
 * @public
 */
export const useMediaQueries = (...queries: string[]) => {
	const stableQueries = useStableArray(queries);

	const mediaQueryLists = useMemo(
		() =>
			typeof window === 'undefined' || typeof window.matchMedia !== 'function'
				? undefined
				: stableQueries.map((query) => matchMedia(query)),
		[stableQueries],
	);

	const snapshotRef = useRef<boolean[]>([]);

	const subscribe = useCallback(
		(onStoreChange: () => void) => {
			if (!mediaQueryLists) {
				return () => undefined;
			}

			for (const mediaQueryList of mediaQueryLists) {
				if (typeof mediaQueryList.addEventListener === 'function') {
					mediaQueryList.addEventListener('change', onStoreChange);
					continue;
				}

				mediaQueryList.addListener(onStoreChange);
			}

			return () => {
				for (const mediaQueryList of mediaQueryLists) {
					if (typeof mediaQueryList.removeEventListener === 'function') {
						mediaQueryList.removeEventListener('change', onStoreChange);
						continue;
					}

					mediaQueryList.removeListener(onStoreChange);
				}
			};
		},
		[mediaQueryLists],
	);

	const getSnapshot = useCallback(() => {
		const matches = mediaQueryLists ? mediaQueryLists.map((mediaQueryList) => mediaQueryList.matches) : stableQueries.map(() => false);
		const cached = snapshotRef.current;

		if (cached.length === matches.length && cached.every((value, index) => value === matches[index])) {
			return cached;
		}

		snapshotRef.current = matches;
		return matches;
	}, [mediaQueryLists, stableQueries]);

	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
