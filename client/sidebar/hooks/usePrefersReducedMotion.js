import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: no-preference)';

const getInitialState = () => !window.matchMedia(QUERY).matches;

export const usePrefersReducedMotion = () => {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(getInitialState);
	useEffect(() => {
		const mediaQueryList = window.matchMedia(QUERY);
		const listener = (event) => {
			setPrefersReducedMotion(!event.matches);
		};
		mediaQueryList.addEventListener('change', listener);
		return () => {
			mediaQueryList.addEventListener('change', listener);
		};
	}, []);
	return prefersReducedMotion;
};
