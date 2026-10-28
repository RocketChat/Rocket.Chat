import { useRef } from 'react';

import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

/**
 * Hook that lets you extract non-reactive logic into a stable callback.
 *
 * A stable callback is a function that has a stable identity across renders,
 * but always “sees” the latest values of your props and state.
 *
 * @param fn - the mutable callback
 * @returns a stable callback
 * @public
 */
export const useStableCallback = <TFunction extends (...args: any[]) => any>(fn: TFunction) => {
	const fnRef = useRef(fn);

	type P = TFunction extends (...args: infer P) => any ? P : never;
	type T = TFunction extends (...args: any) => infer T ? T : never;

	const stableFnRef = useRef((...args: P): T => fnRef.current.call(undefined, ...args));

	useIsomorphicLayoutEffect(() => {
		fnRef.current = fn;
	});

	return stableFnRef.current;
};
