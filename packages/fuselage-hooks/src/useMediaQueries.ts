import { useCallback, useRef, useSyncExternalStore } from 'react';

import { useStableArray } from './useStableArray';

const matchQueries = (queries: string[]) =>
	queries.map((query) => (typeof window === 'undefined' || typeof window.matchMedia !== 'function' ? false : matchMedia(query).matches));

/**
 * Hook to listen to a set of media queries.
 *
 * @param queries - the CSS3 expressions of media queries
 * @returns a set of booleans expressing if the media queries match or not
 * @public
 */
export const useMediaQueries = (...queries: string[]) => {
	const stableQueries = useStableArray(queries);

	const snapshotRef = useRef<{ queries: string[]; matches: boolean[] }>(undefined);

	const subscribe = useCallback(
		(onStoreChange: () => void) => {
			if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
				return () => undefined;
			}

			const mediaQueryLists = stableQueries.map((query) => matchMedia(query));

			const callback = () => {
				snapshotRef.current = { queries: stableQueries, matches: mediaQueryLists.map((mediaQueryList) => mediaQueryList.matches) };
				onStoreChange();
			};

			for (const mediaQueryList of mediaQueryLists) {
				if (typeof mediaQueryList.addEventListener === 'function') {
					mediaQueryList.addEventListener('change', callback);
					continue;
				}

				mediaQueryList.addListener(callback);
			}

			return () => {
				for (const mediaQueryList of mediaQueryLists) {
					if (typeof mediaQueryList.removeEventListener === 'function') {
						mediaQueryList.removeEventListener('change', callback);
						continue;
					}

					mediaQueryList.removeListener(callback);
				}
			};
		},
		[stableQueries],
	);

	const getSnapshot = useCallback(() => {
		if (snapshotRef.current?.queries !== stableQueries) {
			snapshotRef.current = { queries: stableQueries, matches: matchQueries(stableQueries) };
		}

		return snapshotRef.current.matches;
	}, [stableQueries]);

	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
