import { useRef, useEffect } from 'react';

import { useDepsMatch } from './useDepsMatch';

export function useInstance<T>(factory: () => [instance: T, release?: () => void], deps: unknown[]): T {
	'use no memo';

	const ref = useRef<[instance: T, release?: () => void]>(undefined);

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
