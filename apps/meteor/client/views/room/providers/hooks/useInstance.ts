import { useRef, useEffect } from 'react';

import { useDepsMatch } from './useDepsMatch';

export function useInstance<T>(factory: () => [instance: T, release?: () => void], deps: unknown[]): T {
	const ref = useRef<[instance: T, release?: () => void]>();

	useEffect(
		() => () => {
			ref.current?.[1]?.();
		},
		[],
	);

	const depsMatch = useDepsMatch(deps);

	if (!ref.current || !depsMatch) {
		ref.current?.[1]?.();
		ref.current = factory();
	}

	return ref.current[0];
}
