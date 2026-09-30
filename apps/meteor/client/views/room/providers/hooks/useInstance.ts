import type { DependencyList } from 'react';
import { useEffect, useMemo } from 'react';

/** An instance created from `factory` that is replaced when `deps` change and released once it is no longer rendered. */
export function useInstance<T>(factory: () => [instance: T, release?: () => void], deps: DependencyList): T {
	// eslint-disable-next-line react-hooks/exhaustive-deps -- the deps belong to the caller's factory
	const entry = useMemo(factory, deps);

	useEffect(() => entry[1], [entry]);

	return entry[0];
}
