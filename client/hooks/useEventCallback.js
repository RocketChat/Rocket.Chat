import { useCallback, useLayoutEffect, useRef } from 'react';

export const useEventCallback = (fn, ...deps) => {
	const fnRef = useRef(fn);
	const depsRef = useRef(deps);

	useLayoutEffect(() => {
		fnRef.current = fn;
		depsRef.current = deps;
	});

	return useCallback((...args) => (0, fnRef.current)(...depsRef.current, ...args), []);
};
