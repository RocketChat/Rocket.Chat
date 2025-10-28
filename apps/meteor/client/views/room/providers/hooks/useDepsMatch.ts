import { useRef } from 'react';

const depsMatch = (a: unknown[], b: unknown[]): boolean => a.every((value, index) => Object.is(value, b[index]));

export const useDepsMatch = (deps: unknown[]): boolean => {
	const prevDepsRef = useRef(deps);
	const { current: prevDeps } = prevDepsRef;

	const match = depsMatch(prevDeps, deps);

	prevDepsRef.current = deps;

	return match;
};
